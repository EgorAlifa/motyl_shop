import { NextRequest, NextResponse } from 'next/server'
import { createKeycloakUser, listKeycloakUsers } from '@/lib/keycloak'
import { withSuperAdmin } from '@/lib/api-auth'
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
    const users = await listKeycloakUsers()

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: user.enabled,
        emailVerified: user.emailVerified,
        role: user.attributes?.role?.[0] || 'admin',
        permissions: user.attributes?.permissions || [],
      })),
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

    const user = await createKeycloakUser(validatedData)

    return NextResponse.json({
      success: true,
      message: 'Пользователь успешно создан',
      user,
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
