'use client'

import { useEffect } from 'react'

export function SessionSync() {
  useEffect(() => {
    // Проверяем есть ли уже данные в sessionStorage
    const existing = sessionStorage.getItem('adminData')
    if (existing) {
      return // Already synced
    }

    // Получаем auth-token из cookies
    const cookies = document.cookie.split(';')
    const authTokenCookie = cookies.find((c) => c.trim().startsWith('auth-token='))

    if (!authTokenCookie) {
      return // Not logged in
    }

    const token = authTokenCookie.split('=')[1]

    try {
      // Декодируем JWT (берем payload - вторую часть)
      const parts = token.split('.')
      if (parts.length !== 3) {
        console.error('Invalid JWT format')
        return
      }

      const payload = JSON.parse(atob(parts[1]))

      // Сохраняем данные админа в sessionStorage
      const adminData = {
        id: payload.sub,
        email: payload.email,
        role: payload.role, // SUPER_ADMIN or ADMIN
        permissions: payload.permissions || [],
      }

      sessionStorage.setItem('adminData', JSON.stringify(adminData))
      console.log('[SessionSync] Admin data saved to sessionStorage:', adminData)
    } catch (error) {
      console.error('[SessionSync] Failed to decode token:', error)
    }
  }, [])

  return null // This component doesn't render anything
}
