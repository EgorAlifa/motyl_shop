import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { withSuperAdmin } from '@/lib/api-auth'
import { createKeycloakUser } from '@/lib/keycloak'

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

    // Создаем пользователя в Keycloak
    try {
      await createKeycloakUser({
        email,
        password,
        firstName: name || email.split('@')[0],
        lastName: '',
        role: 'admin', // Обычный админ
        permissions: permissions || [],
      })
      console.log('[INFO] Created admin in Keycloak:', email)
    } catch (kcError: any) {
      console.error('[ERROR] Failed to create admin in Keycloak:', kcError)
      // Если пользователь уже существует в Keycloak, продолжаем
      if (!kcError.message?.includes('exists') && !kcError.message?.includes('Conflict')) {
        throw kcError
      }
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)

    // Создаем нового админа в PostgreSQL
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

    console.log('[INFO] Created admin in PostgreSQL:', {
      id: admin.id,
      email: admin.email,
      permissions: admin.permissions,
    })

    return NextResponse.json({
      message: 'Администратор успешно создан в Keycloak и PostgreSQL',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        permissions: admin.permissions,
      },
    })
  } catch (error: any) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: error.message || 'Ошибка при создании администратора' },
      { status: 500 }
    )
  }
})
