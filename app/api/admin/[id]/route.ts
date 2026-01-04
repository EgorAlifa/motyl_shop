import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withSuperAdmin, AuthUser } from '@/lib/api-auth'
import bcrypt from 'bcrypt'

// Обновить админа
export const PATCH = withSuperAdmin(async (
  request: NextRequest,
  user: AuthUser,
  context?: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    const { name, permissions, isBlocked, password } = body
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

    // Подготавливаем данные для обновления
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (permissions !== undefined) updateData.permissions = permissions
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked
    if (password) updateData.password = await bcrypt.hash(password, 10)

    // Обновляем админа
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

    return NextResponse.json({
      message: 'Администратор успешно обновлен',
      admin: updatedAdmin,
    })
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

    // Удаляем админа
    await prisma.admin.delete({
      where: { id: targetId },
    })

    return NextResponse.json({
      message: 'Администратор успешно удален',
    })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении администратора' },
      { status: 500 }
    )
  }
})
