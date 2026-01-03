import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getUserInfo, createSessionToken } from '@/lib/keycloak'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Проверка на ошибки от Keycloak
    if (error) {
      console.error('Keycloak authorization error:', error, errorDescription)
      return NextResponse.redirect(new URL(`/admin/login?error=${error}`, request.url))
    }

    // Проверка наличия authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/login?error=missing_code', request.url)
      )
    }

    // Получаем redirect_uri (должен совпадать с тем, что был в запросе на авторизацию)
    // Используем правильный внешний URL из заголовков
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const redirectUri = `${protocol}://${host}/admin/callback`

    // Обмениваем code на tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    // Получаем информацию о пользователе
    const userInfo = await getUserInfo(tokens.access_token)

    // Проверяем роли пользователя
    const roles = userInfo.realm_access?.roles || []
    const isSuperAdmin = roles.includes('super-admin')
    const isAdmin = roles.includes('admin') || isSuperAdmin

    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.redirect(
        new URL('/admin/login?error=insufficient_permissions', request.url)
      )
    }

    // Создаем JWT токен для нашего приложения
    const sessionToken = await createSessionToken({
      id: userInfo.sub,
      email: userInfo.email,
      role: isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN',
      permissions: roles,
    })

    // Сохраняем токены в cookies
    const cookieStore = await cookies()
    const response = NextResponse.redirect(new URL('/admin', request.url))

    // Основной токен приложения
    cookieStore.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    })

    // Keycloak access token (для прямых запросов к Keycloak API, если нужно)
    cookieStore.set('kc-access-token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
      path: '/',
    })

    // Refresh token (для обновления токенов)
    cookieStore.set('kc-refresh-token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Callback handler error:', error)
    return NextResponse.redirect(
      new URL(`/admin/login?error=${encodeURIComponent(error.message || 'authentication_failed')}`, request.url)
    )
  }
}
