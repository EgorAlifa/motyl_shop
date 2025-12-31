import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, masterPassword } = body

    // Проверяем мастер-пароль (можно настроить через переменные окружения)
    const MASTER_PASSWORD = process.env.ADMIN_MASTER_PASSWORD || 'change-me-in-production'

    if (masterPassword !== MASTER_PASSWORD) {
      return NextResponse.json(
        { error: 'Неверный мастер-пароль' },
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
      },
    })

    return NextResponse.json({
      message: 'Администратор успешно создан',
      admin: {
        id: admin.id,
        email: admin.email,
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
