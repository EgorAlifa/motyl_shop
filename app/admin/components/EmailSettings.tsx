'use client'

import { useEffect, useState } from 'react'
import { Mail, Save, Settings } from 'lucide-react'

interface EmailSettingsData {
  id: string
  notificationEmail: string | null
  sendOrderConfirmation: boolean
  sendStatusUpdates: boolean
}

export default function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    notificationEmail: '',
    sendOrderConfirmation: true,
    sendStatusUpdates: true,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData({
          notificationEmail: data.notificationEmail || '',
          sendOrderConfirmation: data.sendOrderConfirmation,
          sendStatusUpdates: data.sendStatusUpdates,
        })
      } else {
        console.error('Failed to fetch settings')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationEmail: formData.notificationEmail || null,
          sendOrderConfirmation: formData.sendOrderConfirmation,
          sendStatusUpdates: formData.sendStatusUpdates,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        alert('Настройки успешно сохранены')
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка при сохранении настроек')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Ошибка при сохранении настроек')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Настройки уведомлений
          </h2>
        </div>

        <div className="space-y-6">
          {/* Email для уведомлений */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email для уведомлений о заявках
              </div>
            </label>
            <input
              type="email"
              value={formData.notificationEmail}
              onChange={(e) =>
                setFormData({ ...formData, notificationEmail: e.target.value })
              }
              placeholder="admin@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <p className="mt-2 text-sm text-gray-500">
              На этот адрес будут приходить уведомления о новых заявках. Если не указан, используется ADMIN_EMAIL из .env
            </p>
          </div>

          {/* Чекбоксы */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.sendOrderConfirmation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sendOrderConfirmation: e.target.checked,
                  })
                }
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <div>
                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  Отправлять подтверждение заказа клиенту
                </div>
                <div className="text-sm text-gray-500">
                  Клиент получит email с подтверждением заявки после её создания
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.sendStatusUpdates}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sendStatusUpdates: e.target.checked,
                  })
                }
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <div>
                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  Отправлять уведомления о смене статуса заявки
                </div>
                <div className="text-sm text-gray-500">
                  Клиент будет получать email при каждом изменении статуса его заявки
                </div>
              </div>
            </label>
          </div>

          {/* Кнопка сохранения */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
