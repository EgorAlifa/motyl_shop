import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin pages (except login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get('admin-session') || request.cookies.get('auth-token')

    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
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
