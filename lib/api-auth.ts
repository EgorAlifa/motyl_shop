import { NextRequest, NextResponse } from 'next/server'
import { verifyKeycloakToken, introspectToken, decodeAccessToken } from './keycloak'
import { cookies } from 'next/headers'

// Интерфейс для данных пользователя из токена
export interface AuthUser {
  id: string
  email: string
  role: string
  permissions: string[]
}

// Кеш для rate limiting (в production лучше использовать Redis)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()

// Rate limiting middleware
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60000 // 1 минута
): Promise<boolean> {
  const now = Date.now()
  const record = rateLimitCache.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitCache.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// Извлечение и верификация токена из cookies
export async function verifyAuthToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const kcAccessToken = cookieStore.get('kc-access-token')?.value
    const authToken = cookieStore.get('auth-token')?.value

    // Проверяем наличие токенов
    if (!kcAccessToken || !authToken) {
      console.log('[AUTH] Missing tokens:', { hasKcToken: !!kcAccessToken, hasAuthToken: !!authToken })
      return null
    }

    // Проверяем валидность Keycloak токена через introspection
    const introspectionResult = await introspectToken(kcAccessToken)

    if (!introspectionResult.active) {
      console.log('[AUTH] Token is not active (possibly revoked or expired)')
      return null
    }

    // Токен валиден, парсим auth-token для получения ролей
    const payload = await verifyKeycloakToken(authToken)

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role || 'ADMIN',
      permissions: payload.permissions || [],
    }
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error)
    return null
  }
}

// Middleware для защиты API роутов
export async function requireAuth(request: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await verifyAuthToken(request)

  if (!user) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }

  return user
}

// Middleware для проверки роли Super Admin
export async function requireSuperAdmin(request: NextRequest): Promise<AuthUser | NextResponse> {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (authResult.role !== 'SUPER_ADMIN' && authResult.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Недостаточно прав. Требуется роль Super Admin.' },
      { status: 403 }
    )
  }

  return authResult
}

// Middleware для проверки конкретных прав доступа
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<AuthUser | NextResponse> {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  // Super Admin имеет все права
  if (authResult.role === 'SUPER_ADMIN' || authResult.role === 'super_admin') {
    return authResult
  }

  if (!authResult.permissions.includes(permission)) {
    return NextResponse.json(
      { error: `Недостаточно прав. Требуется разрешение: ${permission}` },
      { status: 403 }
    )
  }

  return authResult
}

// Rate limiting для auth endpoints
export async function requireAuthRateLimit(
  request: NextRequest,
  maxRequests: number = 5
): Promise<NextResponse | true> {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  const allowed = await checkRateLimit(ip, maxRequests, 60000) // 5 запросов в минуту

  if (!allowed) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Попробуйте позже.' },
      { status: 429 }
    )
  }

  return true
}

// Утилита для проверки авторизации и получения пользователя
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  return await verifyAuthToken(request)
}

// Декоратор для защиты API routes
export function withAuth<T = any>(
  handler: (request: NextRequest, user: AuthUser, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T) => {
    const authResult = await requireAuth(request)

    if (authResult instanceof NextResponse) {
      return authResult
    }

    return handler(request, authResult, context)
  }
}

// Декоратор для Super Admin endpoints
export function withSuperAdmin<T = any>(
  handler: (request: NextRequest, user: AuthUser, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T) => {
    const authResult = await requireSuperAdmin(request)

    if (authResult instanceof NextResponse) {
      return authResult
    }

    return handler(request, authResult, context)
  }
}

// Декоратор с проверкой конкретного разрешения
export function withPermission<T = any>(
  permission: string,
  handler: (request: NextRequest, user: AuthUser, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T) => {
    const authResult = await requirePermission(request, permission)

    if (authResult instanceof NextResponse) {
      return authResult
    }

    return handler(request, authResult, context)
  }
}
