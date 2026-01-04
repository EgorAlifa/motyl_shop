import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getUserInfo, decodeAccessToken, createSessionToken } from '@/lib/keycloak'
import { cookies } from 'next/headers'

// In-memory cache для предотвращения повторного использования authorization codes
// Map<code, timestamp>
const processedCodes = new Map<string, number>()

// Очистка старых кодов (старше 5 минут)
function cleanupOldCodes() {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  for (const [code, timestamp] of processedCodes.entries()) {
    if (timestamp < fiveMinutesAgo) {
      processedCodes.delete(code)
    }
  }
}

export async function GET(request: NextRequest) {
  // Получаем правильный внешний URL из заголовков
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl = `${protocol}://${host}`

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Проверка на ошибки от Keycloak
    if (error) {
      console.error('Keycloak authorization error:', error, errorDescription)
      return NextResponse.redirect(`${baseUrl}/admin/login?error=${error}`)
    }

    // Проверка наличия authorization code
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/admin/login?error=missing_code`)
    }

    // Защита от повторного использования кода
    if (processedCodes.has(code)) {
      console.log('[WARN] Authorization code already processed, redirecting to admin')
      return NextResponse.redirect(`${baseUrl}/admin`)
    }

    // Отмечаем код как обрабатываемый
    processedCodes.set(code, Date.now())

    // Очищаем старые коды
    cleanupOldCodes()

    // Получаем redirect_uri (должен совпадать с тем, что был в запросе на авторизацию)
    const redirectUri = `${baseUrl}/admin/callback`

    // Обмениваем code на tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    // Декодируем access_token чтобы получить роли
    const tokenPayload = decodeAccessToken(tokens.access_token)

    console.log('[DEBUG] Access token decoded:', {
      email: tokenPayload.email || tokenPayload.preferred_username,
      sub: tokenPayload.sub,
      realm_access: tokenPayload.realm_access,
      allRoles: tokenPayload.realm_access?.roles || [],
    })

    // Проверяем роли пользователя
    const roles = tokenPayload.realm_access?.roles || []
    const isSuperAdmin = roles.includes('super-admin')
    const isAdmin = roles.includes('admin') || isSuperAdmin

    console.log('[DEBUG] Role check:', {
      roles,
      isSuperAdmin,
      isAdmin,
      hasPermission: isAdmin || isSuperAdmin,
    })

    if (!isAdmin && !isSuperAdmin) {
      console.error('[ERROR] User has insufficient permissions:', {
        email: tokenPayload.email || tokenPayload.preferred_username,
        roles,
      })
      return NextResponse.redirect(`${baseUrl}/admin/login?error=insufficient_permissions`)
    }

    // Создаем JWT токен для нашего приложения
    const sessionToken = await createSessionToken({
      id: tokenPayload.sub,
      email: tokenPayload.email || tokenPayload.preferred_username || '',
      role: isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN',
      permissions: roles,
    })

    // Сохраняем токены в cookies
    const cookieStore = await cookies()
    const response = NextResponse.redirect(`${baseUrl}/admin`)

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

    // Удаляем код из кеша при ошибке, чтобы можно было повторить попытку
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    if (code) {
      processedCodes.delete(code)
    }

    const errorMessage = encodeURIComponent(error.message || 'authentication_failed')
    return NextResponse.redirect(`${baseUrl}/admin/login?error=${errorMessage}`)
  }
}
