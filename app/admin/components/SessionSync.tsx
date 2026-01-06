'use client'

import { useEffect } from 'react'

export function SessionSync() {
  useEffect(() => {
    console.log('[SessionSync] Component mounted, starting sync...')

    // Запрашиваем актуальные данные пользователя с сервера
    // ВСЕГДА обновляем, даже если данные уже есть в sessionStorage
    fetch('/api/auth/me')
      .then((res) => {
        console.log('[SessionSync] API response status:', res.status)
        if (!res.ok) {
          console.log('[SessionSync] Auth check failed - keeping existing adminData')
          // НЕ очищаем sessionStorage при 401 - токен может требовать обновления
          // Пользователь будет перенаправлен на логин при попытке доступа к защищенным ресурсам
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!data || !data.authenticated) {
          console.log('[SessionSync] No auth data received - keeping existing adminData')
          // НЕ очищаем sessionStorage - пусть middleware решает
          return
        }

        console.log('[SessionSync] User data received:', data.user)

        // Проверяем изменились ли данные
        const existing = sessionStorage.getItem('adminData')
        const newAdminData = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role, // SUPER_ADMIN or ADMIN
          permissions: data.user.permissions || [],
        }

        const newAdminDataStr = JSON.stringify(newAdminData)

        // Сохраняем данные админа в sessionStorage
        sessionStorage.setItem('adminData', newAdminDataStr)

        // Если данные изменились, триггерим событие для обновления навигации
        if (existing !== newAdminDataStr) {
          console.log('[SessionSync] Admin data updated, dispatching storage event')
          console.log('[SessionSync] Old:', existing)
          console.log('[SessionSync] New:', newAdminDataStr)

          // Trigger a storage event to update AdminNav
          window.dispatchEvent(new Event('storage'))
        } else {
          console.log('[SessionSync] Admin data unchanged')
        }
      })
      .catch((error) => {
        console.error('[SessionSync] Failed to fetch user data:', error)
      })
  }, [])

  return null // This component doesn't render anything
}
