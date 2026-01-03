import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logoutFromKeycloak } from '@/lib/keycloak'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('kc-refresh-token')?.value

    // Logout from Keycloak if we have refresh token
    if (refreshToken) {
      await logoutFromKeycloak(refreshToken).catch((error) => {
        console.error('Keycloak logout error:', error)
        // Не прерываем процесс, даже если logout в Keycloak не удался
      })
    }

    // Clear all auth cookies
    const response = NextResponse.json({ success: true })

    cookieStore.delete('auth-token')
    cookieStore.delete('kc-access-token')
    cookieStore.delete('kc-refresh-token')
    cookieStore.delete('admin-session') // legacy cookie

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
