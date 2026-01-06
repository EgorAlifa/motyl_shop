import { NextRequest, NextResponse } from 'next/server'
import { deleteKeycloakUser, updateKeycloakUser, resetKeycloakUserPassword, updateUserRole, getKeycloakAdmin } from '@/lib/keycloak'
import { withSuperAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  enabled: z.boolean().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'super_admin']).optional(),
  permissions: z.array(z.string()).optional(),
})

// DELETE /api/keycloak/users/[id] - удалить пользователя
export const DELETE = withSuperAdmin(
  async (request: NextRequest, user, context) => {
    try {
      const { id } = context!.params

      // Получаем email пользователя из Keycloak перед удалением
      const kcAdmin = await getKeycloakAdmin()
      const kcUser = await kcAdmin.users.findOne({ id })

      if (kcUser?.email) {
        // Удаляем запись из PostgreSQL
        await prisma.admin.deleteMany({
          where: { email: kcUser.email },
        })
        console.log('[INFO] Deleted admin from PostgreSQL:', kcUser.email)
      }

      // Удаляем пользователя из Keycloak
      await deleteKeycloakUser(id)

      return NextResponse.json({
        success: true,
        message: 'Пользователь успешно удален из Keycloak и PostgreSQL',
      })
    } catch (error: any) {
      console.error('Error deleting Keycloak user:', error)
      return NextResponse.json(
        { error: error.message || 'Ошибка при удалении пользователя' },
        { status: 500 }
      )
    }
  }
)

// PATCH /api/keycloak/users/[id] - обновить пользователя
export const PATCH = withSuperAdmin(
  async (request: NextRequest, user, context) => {
    try {
      const { id } = context!.params
      const body = await request.json()
      const validatedData = updateUserSchema.parse(body)

      // Получаем email пользователя из Keycloak
      const kcAdmin = await getKeycloakAdmin()
      const kcUser = await kcAdmin.users.findOne({ id })

      if (!kcUser?.email) {
        return NextResponse.json(
          { error: 'Пользователь не найден в Keycloak' },
          { status: 404 }
        )
      }

      // Подготавливаем данные для обновления в PostgreSQL
      const pgUpdateData: any = {}
      let passwordToUpdate: string | undefined

      // Если передан пароль, сохраняем для обновления в обеих системах
      if (validatedData.password) {
        await resetKeycloakUserPassword(id, validatedData.password, false)
        passwordToUpdate = validatedData.password
        delete validatedData.password
      }

      // Если передана новая роль, обновляем её
      if (validatedData.role) {
        await updateUserRole(id, validatedData.role)
        pgUpdateData.role = validatedData.role === 'super_admin' ? 'SUPER_ADMIN' : 'ADMIN'
        delete validatedData.role
      }

      // Если передано имя, сохраняем для PostgreSQL
      if (validatedData.firstName) {
        pgUpdateData.name = validatedData.firstName
      }

      // Если переданы permissions, обновляем в обеих системах
      if (validatedData.permissions !== undefined) {
        const attributes: Record<string, string[]> = {
          permissions: validatedData.permissions,
        }

        // Обновляем permissions через attributes в Keycloak
        await updateKeycloakUser(id, { attributes })

        // Сохраняем permissions для PostgreSQL
        pgUpdateData.permissions = validatedData.permissions

        delete validatedData.permissions
      }

      // Если передан статус enabled, обновляем isBlocked в PostgreSQL
      if (validatedData.enabled !== undefined) {
        pgUpdateData.isBlocked = !validatedData.enabled
      }

      // Обновляем остальные данные в Keycloak
      if (Object.keys(validatedData).length > 0) {
        await updateKeycloakUser(id, validatedData)
      }

      // Обновляем пароль в PostgreSQL если был изменен
      if (passwordToUpdate) {
        pgUpdateData.password = await bcrypt.hash(passwordToUpdate, 10)
      }

      // Синхронизируем изменения с PostgreSQL
      if (Object.keys(pgUpdateData).length > 0) {
        await prisma.admin.updateMany({
          where: { email: kcUser.email },
          data: pgUpdateData,
        })

        console.log('[INFO] Updated admin in PostgreSQL:', {
          email: kcUser.email,
          updates: Object.keys(pgUpdateData),
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Пользователь успешно обновлен в Keycloak и PostgreSQL',
      })
    } catch (error: any) {
      console.error('Error updating Keycloak user:', error)

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: error.message || 'Ошибка при обновлении пользователя' },
        { status: 500 }
      )
    }
  }
)
