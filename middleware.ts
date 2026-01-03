import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin pages (except callback)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/callback')) {
    const session = request.cookies.get('auth-token')

    if (!session) {
      // Redirect to Keycloak login (Authorization Code Flow)
      const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080/auth'
      const keycloakRealm = process.env.KEYCLOAK_REALM || 'motyl-shop'
      const clientId = process.env.KEYCLOAK_CLIENT_ID || 'motyl-admin'

      // Get the proper external URL from headers or env
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const baseUrl = `${protocol}://${host}`

      const authUrl = new URL(`${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/auth`)
      const redirectUri = `${baseUrl}/admin/callback`

      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', 'openid email profile')

      return NextResponse.redirect(authUrl.toString())
    }
  }

  // Protect API routes (except public ones)
  if (pathname.startsWith('/api/')) {
    // Публичные API endpoints (не требуют авторизации)
    const publicEndpoints = [
      '/api/auth/login',
      '/api/orders', // POST для создания заказов из публичной формы
      '/api/products', // GET для каталога
    ]

    // Проверяем, является ли endpoint публичным
    const isPublicEndpoint = publicEndpoints.some((endpoint) => {
      if (pathname === endpoint) {
        // Для /api/orders и /api/products проверяем метод
        if (endpoint === '/api/orders' && request.method !== 'POST') {
          return false
        }
        if (endpoint === '/api/products' && request.method !== 'GET') {
          return false
        }
        return true
      }
      return false
    })

    if (!isPublicEndpoint) {
      const token = request.cookies.get('auth-token') || request.cookies.get('admin-session')

      if (!token) {
        return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
