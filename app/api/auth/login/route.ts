import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { createSessionToken } from '@/lib/keycloak'
import { requireAuthRateLimit } from '@/lib/api-auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 попыток в минуту
    const rateLimitResult = await requireAuthRateLimit(request, 5)
    if (rateLimitResult !== true) {
      return rateLimitResult
    }

    const { email, password } = await request.json()

    const admin = await verifyAdmin(email, password)

    if (!admin) {
      return NextResponse.json(
        { error: 'Неверный email или пароль, либо аккаунт заблокирован' },
        { status: 401 }
      )
    }

    // Создаем JWT токен
    const token = await createSessionToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    })

    // Set session cookies
    const response = NextResponse.json({
      success: true,
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    })

    const cookieStore = await cookies()

    // JWT токен в httpOnly cookie
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Backward compatibility - оставляем старые cookies
    cookieStore.set('admin-session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    cookieStore.set('admin_id', admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Ошибка при входе' }, { status: 500 })
  }
}
