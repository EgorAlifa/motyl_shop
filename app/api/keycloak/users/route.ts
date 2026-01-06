import { NextRequest, NextResponse } from 'next/server'
import { createKeycloakUser, listKeycloakUsers } from '@/lib/keycloak'
import { withSuperAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'super_admin']).default('admin'),
  permissions: z.array(z.string()).default([]),
})

// GET /api/keycloak/users - получить список пользователей
export const GET = withSuperAdmin(async (request: NextRequest) => {
  try {
    const keycloakUsers = await listKeycloakUsers()

    // Получаем все записи админов из PostgreSQL для синхронизации permissions
    const pgAdmins = await prisma.admin.findMany({
      select: {
        email: true,
        permissions: true,
        role: true,
      },
    })

    // Создаем мапу для быстрого доступа к permissions по email
    const permissionsMap = new Map(
      pgAdmins.map((admin) => [admin.email, { permissions: admin.permissions, pgRole: admin.role }])
    )

    return NextResponse.json({
      users: keycloakUsers.map((user) => {
        // Определяем роль: сначала смотрим в realm roles, потом в attributes
        let role: 'admin' | 'super_admin' = 'admin'

        if (user.realmRoles?.includes('super-admin')) {
          role = 'super_admin'
        } else if (user.attributes?.role?.[0]) {
          role = user.attributes.role[0] as 'admin' | 'super_admin'
        }

        // Получаем permissions из PostgreSQL (единственный источник истины)
        const pgData = user.email ? permissionsMap.get(user.email) : null
        const permissions = pgData?.permissions || []

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          enabled: user.enabled,
          emailVerified: user.emailVerified,
          role: role,
          permissions: permissions, // Читаем из PostgreSQL
        }
      }),
    })
  } catch (error: any) {
    console.error('Error fetching Keycloak users:', error)
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении пользователей' },
      { status: 500 }
    )
  }
})

// POST /api/keycloak/users - создать пользователя
export const POST = withSuperAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Проверяем, не существует ли уже такой admin в PostgreSQL
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: validatedData.email },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Администратор с таким email уже существует' },
        { status: 400 }
      )
    }

    // Создаем пользователя в Keycloak
    const keycloakUser = await createKeycloakUser(validatedData)

    // Хешируем пароль для PostgreSQL
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Создаем запись в PostgreSQL для синхронизации permissions
    const admin = await prisma.admin.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.firstName || validatedData.email,
        role: validatedData.role === 'super_admin' ? 'SUPER_ADMIN' : 'ADMIN',
        permissions: validatedData.permissions || [],
        isBlocked: false,
      },
    })

    console.log('[INFO] Created admin in PostgreSQL:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    })

    return NextResponse.json({
      success: true,
      message: 'Пользователь успешно создан в Keycloak и PostgreSQL',
      user: keycloakUser,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating Keycloak user:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Ошибка при создании пользователя' },
      { status: 500 }
    )
  }
})
