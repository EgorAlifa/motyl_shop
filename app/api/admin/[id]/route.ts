import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'

// Обновить админа
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, permissions, isBlocked, password } = body

    // Проверяем авторизацию
    const cookieStore = await cookies()
    const adminId = cookieStore.get('admin_id')?.value

    if (!adminId) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    // Проверяем, что текущий пользователь - суперадмин
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
    })

    if (!currentAdmin || currentAdmin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    // Проверяем, что редактируемый админ существует
    const targetAdmin = await prisma.admin.findUnique({
      where: { id: params.id },
    })

    if (!targetAdmin) {
      return NextResponse.json(
        { error: 'Администратор не найден' },
        { status: 404 }
      )
    }

    // Нельзя редактировать себя (кроме пароля)
    if (params.id === adminId && (permissions || isBlocked !== undefined)) {
      return NextResponse.json(
        { error: 'Нельзя изменять свои права и статус блокировки' },
        { status: 400 }
      )
    }

    // Нельзя редактировать другого суперадмина
    if (targetAdmin.role === 'SUPER_ADMIN' && targetAdmin.id !== adminId) {
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
      where: { id: params.id },
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
}

// Удалить админа
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const cookieStore = await cookies()
    const adminId = cookieStore.get('admin_id')?.value

    if (!adminId) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    // Проверяем, что текущий пользователь - суперадмин
    const currentAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
    })

    if (!currentAdmin || currentAdmin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    // Нельзя удалить себя
    if (params.id === adminId) {
      return NextResponse.json(
        { error: 'Нельзя удалить самого себя' },
        { status: 400 }
      )
    }

    // Проверяем, что удаляемый админ существует
    const targetAdmin = await prisma.admin.findUnique({
      where: { id: params.id },
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
      where: { id: params.id },
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
}
