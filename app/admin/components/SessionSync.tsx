'use client'

import { useEffect } from 'react'

export function SessionSync() {
  useEffect(() => {
    console.log('[SessionSync] Component mounted, starting sync...')

    // Проверяем есть ли уже данные в sessionStorage
    const existing = sessionStorage.getItem('adminData')
    if (existing) {
      console.log('[SessionSync] Data already exists in sessionStorage:', existing)
      return // Already synced
    }

    // Запрашиваем данные пользователя с сервера (httpOnly cookies недоступны в JS)
    fetch('/api/auth/me')
      .then((res) => {
        console.log('[SessionSync] API response status:', res.status)
        if (!res.ok) {
          console.log('[SessionSync] Not authenticated')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!data || !data.authenticated) {
          console.log('[SessionSync] User not authenticated')
          return
        }

        console.log('[SessionSync] User data received:', data.user)

        // Сохраняем данные админа в sessionStorage
        const adminData = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role, // SUPER_ADMIN or ADMIN
          permissions: data.user.permissions || [],
        }

        sessionStorage.setItem('adminData', JSON.stringify(adminData))
        console.log('[SessionSync] Admin data saved to sessionStorage:', adminData)

        // Trigger a storage event to update AdminNav
        window.dispatchEvent(new Event('storage'))
        console.log('[SessionSync] Storage event dispatched')
      })
      .catch((error) => {
        console.error('[SessionSync] Failed to fetch user data:', error)
      })
  }, [])

  return null // This component doesn't render anything
}
