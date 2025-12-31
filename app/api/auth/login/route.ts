import { NextRequest, NextResponse } from 'next/server'
import { loginWithKeycloak } from '@/lib/keycloak-auth'
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

    // Авторизация через Keycloak
    const loginResult = await loginWithKeycloak(email, password)

    if (!loginResult.success || !loginResult.admin || !loginResult.token) {
      return NextResponse.json(
        { error: loginResult.error || 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Set session cookies
    const response = NextResponse.json({
      success: true,
      admin: loginResult.admin,
    })

    const cookieStore = await cookies()

    // JWT токен в httpOnly cookie
    cookieStore.set('auth-token', loginResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Backward compatibility - оставляем старые cookies для админки
    cookieStore.set('admin-session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    cookieStore.set('admin_id', loginResult.admin.id, {
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
