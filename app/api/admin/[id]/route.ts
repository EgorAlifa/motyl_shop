import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withSuperAdmin, AuthUser } from '@/lib/api-auth'
import { getKeycloakAdmin, createSessionToken, resetKeycloakUserPassword, updateKeycloakUser, updateUserRole, deleteKeycloakUser } from '@/lib/keycloak'
import bcrypt from 'bcrypt'

// Обновить админа
export const PATCH = withSuperAdmin(async (
  request: NextRequest,
  user: AuthUser,
  context?: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    const { name, email, permissions, isBlocked, password } = body
    const targetId = context?.params?.id

    if (!targetId) {
      return NextResponse.json(
        { error: 'ID администратора не указан' },
        { status: 400 }
      )
    }

    // Проверяем, что редактируемый админ существует
    const targetAdmin = await prisma.admin.findUnique({
      where: { id: targetId },
    })

    if (!targetAdmin) {
      return NextResponse.json(
        { error: 'Администратор не найден' },
        { status: 404 }
      )
    }

    // Нельзя редактировать себя (кроме пароля)
    if (targetId === user.id && (permissions || isBlocked !== undefined)) {
      return NextResponse.json(
        { error: 'Нельзя изменять свои права и статус блокировки' },
        { status: 400 }
      )
    }

    // Нельзя редактировать другого суперадмина
    if (targetAdmin.role === 'SUPER_ADMIN' && targetAdmin.id !== user.id) {
      return NextResponse.json(
        { error: 'Нельзя редактировать других суперадминов' },
        { status: 403 }
      )
    }

    // Получаем Keycloak Admin client
    const kcAdmin = await getKeycloakAdmin()

    // Находим пользователя в Keycloak по email
    const kcUsers = await kcAdmin.users.find({
      email: targetAdmin.email,
      exact: true,
    })

    if (!kcUsers || kcUsers.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь не найден в Keycloak' },
        { status: 404 }
      )
    }

    const kcUser = kcUsers[0]
    const kcUserId = kcUser.id

    if (!kcUserId) {
      return NextResponse.json(
        { error: 'ID пользователя Keycloak не найден' },
        { status: 404 }
      )
    }

    // Обновляем данные в Keycloak
    // НЕ синхронизируем permissions с Keycloak - они хранятся только в PostgreSQL
    const kcUpdates: any = {
      email: kcUser.email || targetAdmin.email,
      username: kcUser.username || kcUser.email || targetAdmin.email,
    }

    if (name !== undefined) {
      kcUpdates.firstName = name
    }

    if (isBlocked !== undefined) {
      kcUpdates.enabled = !isBlocked
    }

    // Применяем обновления в Keycloak
    await kcAdmin.users.update({ id: kcUserId }, kcUpdates)

    // Обновляем пароль в Keycloak если указан
    if (password) {
      await resetKeycloakUserPassword(kcUserId, password, false)
    }

    // Синхронизируем permissions с Keycloak attributes
    if (permissions !== undefined) {
      await updateKeycloakUser(kcUserId, {
        attributes: {
          permissions: permissions,
        },
      })
      console.log('[INFO] Updated permissions in Keycloak:', permissions)
    }

    // Подготавливаем данные для обновления в PostgreSQL
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (permissions !== undefined) updateData.permissions = permissions
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked
    if (password) updateData.password = await bcrypt.hash(password, 10)

    // Обновляем админа в PostgreSQL
    const updatedAdmin = await prisma.admin.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isBlocked: true,
        lastLogin: true,
        createdAt: true,
      },
    })

    // Создаём ответ
    const response = NextResponse.json({
      message: 'Администратор успешно обновлен',
      admin: updatedAdmin,
      shouldReload: targetId === user.id && permissions !== undefined, // Флаг для перезагрузки страницы
    })

    // Если обновляли permissions текущего пользователя, обновляем его сессию
    if (targetId === user.id && permissions !== undefined) {
      const newSessionToken = await createSessionToken({
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: permissions,
      })

      // Устанавливаем новый токен в куки
      response.cookies.set('auth-token', newSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении администратора' },
      { status: 500 }
    )
  }
})

// Удалить админа
export const DELETE = withSuperAdmin(async (
  request: NextRequest,
  user: AuthUser,
  context?: { params: { id: string } }
) => {
  try {
    const targetId = context?.params?.id

    if (!targetId) {
      return NextResponse.json(
        { error: 'ID администратора не указан' },
        { status: 400 }
      )
    }

    // Нельзя удалить себя
    if (targetId === user.id) {
      return NextResponse.json(
        { error: 'Нельзя удалить самого себя' },
        { status: 400 }
      )
    }

    // Проверяем, что удаляемый админ существует
    const targetAdmin = await prisma.admin.findUnique({
      where: { id: targetId },
    })

    if (!targetAdmin) {
      return NextResponse.json(
        { error: 'Администратор не найден' },
        { status: 404 }
      )
    }

    // Нельзя удалить суперадмина
    if (targetAdmin.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Нельзя удалить суперадмина' },
        { status: 403 }
      )
    }

    // Удаляем из Keycloak
    try {
      const kcAdmin = await getKeycloakAdmin()
      const kcUsers = await kcAdmin.users.find({
        email: targetAdmin.email,
        exact: true,
      })

      if (kcUsers && kcUsers.length > 0 && kcUsers[0].id) {
        await deleteKeycloakUser(kcUsers[0].id)
        console.log('[INFO] Deleted admin from Keycloak:', targetAdmin.email)
      }
    } catch (kcError) {
      console.error('[ERROR] Failed to delete admin from Keycloak:', kcError)
      // Продолжаем удаление из PostgreSQL даже если не удалось удалить из Keycloak
    }

    // Удаляем админа из PostgreSQL
    await prisma.admin.delete({
      where: { id: targetId },
    })

    console.log('[INFO] Deleted admin from PostgreSQL:', targetAdmin.email)

    return NextResponse.json({
      message: 'Администратор успешно удален из Keycloak и PostgreSQL',
    })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении администратора' },
      { status: 500 }
    )
  }
})
