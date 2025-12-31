import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const admin = await verifyAdmin(email, password)

    if (!admin) {
      return NextResponse.json(
        { error: 'Неверный email или пароль, либо аккаунт заблокирован' },
        { status: 401 }
      )
    }

    // Set session cookies
    const response = NextResponse.json({
      success: true,
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      }
    })

    const cookieStore = await cookies()

    // Session cookie
    cookieStore.set('admin-session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Admin ID cookie (для проверки прав)
    cookieStore.set('admin_id', admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка при входе' },
      { status: 500 }
    )
  }
}
