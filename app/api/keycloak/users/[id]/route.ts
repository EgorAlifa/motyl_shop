import { NextRequest, NextResponse } from 'next/server'
import { deleteKeycloakUser, updateKeycloakUser, resetKeycloakUserPassword } from '@/lib/keycloak'
import { withSuperAdmin } from '@/lib/api-auth'
import { z } from 'zod'

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  enabled: z.boolean().optional(),
  password: z.string().min(8).optional(),
})

// DELETE /api/keycloak/users/[id] - удалить пользователя
export const DELETE = withSuperAdmin(
  async (request: NextRequest, user, context) => {
    try {
      const { id } = context!.params

      await deleteKeycloakUser(id)

      return NextResponse.json({
        success: true,
        message: 'Пользователь успешно удален',
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

      // Если передан пароль, сбрасываем его отдельно
      if (validatedData.password) {
        await resetKeycloakUserPassword(id, validatedData.password, false)
        delete validatedData.password
      }

      // Обновляем остальные данные
      if (Object.keys(validatedData).length > 0) {
        await updateKeycloakUser(id, validatedData)
      }

      return NextResponse.json({
        success: true,
        message: 'Пользователь успешно обновлен',
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
