'use client'

import { useEffect } from 'react'

// Функция для декодирования base64url (используется в JWT)
function base64UrlDecode(str: string): string {
  // Заменяем символы base64url на base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')

  // Добавляем padding если нужно
  const pad = base64.length % 4
  if (pad) {
    if (pad === 1) {
      throw new Error('Invalid base64url string')
    }
    base64 += new Array(5 - pad).join('=')
  }

  return atob(base64)
}

export function SessionSync() {
  useEffect(() => {
    console.log('[SessionSync] Component mounted, starting sync...')

    // Проверяем есть ли уже данные в sessionStorage
    const existing = sessionStorage.getItem('adminData')
    if (existing) {
      console.log('[SessionSync] Data already exists in sessionStorage:', existing)
      return // Already synced
    }

    // Получаем auth-token из cookies
    const cookies = document.cookie.split(';')
    console.log('[SessionSync] Cookies found:', cookies.length)

    const authTokenCookie = cookies.find((c) => c.trim().startsWith('auth-token='))

    if (!authTokenCookie) {
      console.log('[SessionSync] No auth-token cookie found')
      return // Not logged in
    }

    const token = authTokenCookie.split('=')[1]
    console.log('[SessionSync] Found auth-token, length:', token?.length)

    try {
      // Декодируем JWT (берем payload - вторую часть)
      const parts = token.split('.')
      if (parts.length !== 3) {
        console.error('[SessionSync] Invalid JWT format, parts:', parts.length)
        return
      }

      const payloadJson = base64UrlDecode(parts[1])
      const payload = JSON.parse(payloadJson)

      console.log('[SessionSync] Decoded payload:', payload)

      // Сохраняем данные админа в sessionStorage
      const adminData = {
        id: payload.sub,
        email: payload.email,
        role: payload.role, // SUPER_ADMIN or ADMIN
        permissions: payload.permissions || [],
      }

      sessionStorage.setItem('adminData', JSON.stringify(adminData))
      console.log('[SessionSync] Admin data saved to sessionStorage:', adminData)

      // Trigger a storage event to update AdminNav
      window.dispatchEvent(new Event('storage'))
      console.log('[SessionSync] Storage event dispatched')
    } catch (error) {
      console.error('[SessionSync] Failed to decode token:', error)
    }
  }, [])

  return null // This component doesn't render anything
}
