import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { decodeAccessToken } from '@/lib/keycloak'

// GET /api/admin/debug - временный endpoint для отладки
export const GET = withAuth(async (request: NextRequest, authUser) => {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value
    const kcToken = cookieStore.get('kc-access-token')?.value

    // Декодируем токены
    const authTokenData = authToken ? decodeAccessToken(authToken) : null
    const kcTokenData = kcToken ? decodeAccessToken(kcToken) : null

    // Получаем данные из PostgreSQL
    const pgAdmin = await prisma.admin.findUnique({
      where: { email: authUser.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isBlocked: true,
        lastLogin: true,
      },
    })

    return NextResponse.json({
      message: 'Debug info for current admin',
      authUser: authUser, // Данные из middleware
      authToken: {
        exists: !!authToken,
        payload: authTokenData,
      },
      kcToken: {
        exists: !!kcToken,
        payload: kcTokenData ? {
          email: kcTokenData.email,
          preferred_username: kcTokenData.preferred_username,
          realm_access: kcTokenData.realm_access,
        } : null,
      },
      postgresql: pgAdmin,
      sessionStorage: {
        note: 'Check browser console for sessionStorage data'
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
})
