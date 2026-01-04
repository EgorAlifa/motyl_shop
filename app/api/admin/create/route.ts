import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { withSuperAdmin } from '@/lib/api-auth'

export const POST = withSuperAdmin(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const { email, password, name, permissions } = body

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
})
