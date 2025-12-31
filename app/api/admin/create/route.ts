import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, permissions } = body

    // Проверяем авторизацию текущего пользователя
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
        { error: 'Недостаточно прав. Только суперадмин может создавать администраторов.' },
        { status: 403 }
      )
    }

    // Проверяем, не существует ли уже такой admin
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Администратор с таким email уже существует' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)

    // Создаем нового админа
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email,
        role: 'ADMIN',
        permissions: permissions || [],
        isBlocked: false,
      },
    })

    return NextResponse.json({
      message: 'Администратор успешно создан',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        permissions: admin.permissions,
      },
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании администратора' },
      { status: 500 }
    )
  }
}
