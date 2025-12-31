'use client'

import { useEffect, useState } from 'react'
import { AdminNav } from '../components/AdminNav'
import { formatDate } from '@/lib/utils'
import { Users, Plus, Edit, Trash2, Lock, Unlock, Check, X } from 'lucide-react'

const PERMISSION_LABELS = {
  dashboard: 'Дашборд',
  products: 'Товары',
  orders: 'Заявки',
  admins: 'Управление админами',
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any>(null)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/list')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data)
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBlock = async (adminId: string, isBlocked: boolean) => {
    if (!confirm(`${isBlocked ? 'Разблокировать' : 'Заблокировать'} администратора?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      })

      if (response.ok) {
        fetchAdmins()
      } else {
        const data = await response.json()
        alert(data.error || 'Ошибка при обновлении')
      }
    } catch (error) {
      console.error('Failed to update admin:', error)
      alert('Ошибка при обновлении администратора')
    }
  }

  const handleDelete = async (adminId: string) => {
    if (!confirm('Удалить администратора? Это действие необратимо!')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/${adminId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAdmins()
      } else {
        const data = await response.json()
        alert(data.error || 'Ошибка при удалении')
      }
    } catch (error) {
      console.error('Failed to delete admin:', error)
      alert('Ошибка при удалении администратора')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40">
        <AdminNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Управление администраторами
            </h1>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-medium shadow-md hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Добавить администратора
          </button>
        </div>

        {(showCreateForm || editingAdmin) && (
          <AdminForm
            admin={editingAdmin}
            onClose={() => {
              setShowCreateForm(false)
              setEditingAdmin(null)
            }}
            onSave={() => {
              fetchAdmins()
              setShowCreateForm(false)
              setEditingAdmin(null)
            }}
          />
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Администратор
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Права доступа
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Последний вход
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{admin.name}</div>
                    <div className="text-sm text-gray-500">{admin.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {admin.role === 'SUPER_ADMIN' ? (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Суперадмин
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Администратор
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {admin.permissions && admin.permissions.length > 0 ? (
                        admin.permissions.map((perm: string) => (
                          <span
                            key={perm}
                            className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                          >
                            {PERMISSION_LABELS[perm as keyof typeof PERMISSION_LABELS] || perm}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Нет прав</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {admin.lastLogin ? formatDate(admin.lastLogin) : 'Никогда'}
                  </td>
                  <td className="px-6 py-4">
                    {admin.isBlocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <X className="h-3 w-3" />
                        Заблокирован
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3" />
                        Активен
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {admin.role !== 'SUPER_ADMIN' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingAdmin(admin)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleBlock(admin.id, admin.isBlocked)}
                          className={`p-2 rounded-lg transition-colors ${admin.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                          title={admin.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                        >
                          {admin.isBlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {admins.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Администраторов пока нет
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function AdminForm({
  admin,
  onClose,
  onSave,
}: {
  admin: any
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    password: '',
    permissions: admin?.permissions || [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availablePermissions = [
    { key: 'dashboard', label: 'Дашборд' },
    { key: 'products', label: 'Управление товарами' },
    { key: 'orders', label: 'Управление заявками' },
  ]

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p: string) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = admin ? `/api/admin/${admin.id}` : '/api/admin/create'
      const method = admin ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admin ? {
          name: formData.name,
          permissions: formData.permissions,
          ...(formData.password && { password: formData.password })
        } : formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при сохранении')
      }

      onSave()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100">
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {admin ? 'Редактировать администратора' : 'Создать администратора'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Имя</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            {!admin && (
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2">
                {admin ? 'Новый пароль (оставьте пустым, если не хотите менять)' : 'Пароль'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required={!admin}
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Права доступа</label>
              <div className="space-y-2">
                {availablePermissions.map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-100 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-medium shadow-md"
              >
                {loading ? 'Сохранение...' : admin ? 'Сохранить' : 'Создать'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all font-medium shadow-sm"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
