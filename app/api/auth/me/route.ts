import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decodeAccessToken } from '@/lib/keycloak'

// GET /api/auth/me - получить данные текущего пользователя
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Декодируем auth-token для получения данных пользователя
    const payload = decodeAccessToken(authToken)

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.sub,
        email: payload.email || payload.preferred_username,
        role: payload.role || 'ADMIN',
        permissions: payload.permissions || [],
      },
    })
  } catch (error) {
    console.error('[API /auth/me] Error:', error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
