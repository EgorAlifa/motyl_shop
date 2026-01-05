'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, Edit, Trash2, Check, X, Shield } from 'lucide-react'

interface KeycloakUser {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  enabled: boolean
  emailVerified?: boolean
  role: 'admin' | 'super_admin'
  permissions?: string[]
}

// Доступные разделы админки
const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'Панель управления' },
  { id: 'products', label: 'Товары' },
  { id: 'orders', label: 'Заявки' },
] as const

export default function KeycloakUsersPage() {
  const [users, setUsers] = useState<KeycloakUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<KeycloakUser | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/keycloak/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка при загрузке пользователей')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      alert('Ошибка при загрузке пользователей')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Удалить пользователя из Keycloak? Это действие необратимо!')) {
      return
    }

    try {
      const response = await fetch(`/api/keycloak/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchUsers()
        alert('Пользователь успешно удален')
      } else {
        const data = await response.json()
        alert(data.error || 'Ошибка при удалении')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Ошибка при удалении пользователя')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40">
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

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Пользователи Keycloak
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Управление пользователями через систему аутентификации Keycloak
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium shadow-md hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Добавить пользователя
          </button>
        </div>

        {(showCreateForm || editingUser) && (
          <UserForm
            user={editingUser}
            onClose={() => {
              setShowCreateForm(false)
              setEditingUser(null)
            }}
            onSave={() => {
              fetchUsers()
              setShowCreateForm(false)
              setEditingUser(null)
            }}
          />
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Доступ к разделам
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : user.username}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'super_admin' ? (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'super_admin' ? (
                        <span className="text-xs text-gray-500 italic">Полный доступ</span>
                      ) : user.permissions && user.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.map((permission) => {
                            const permLabel = AVAILABLE_PERMISSIONS.find((p) => p.id === permission)?.label || permission
                            return (
                              <span
                                key={permission}
                                className="inline-block px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-200"
                              >
                                {permLabel}
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Нет доступа</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="h-3 w-3" />
                          Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <X className="h-3 w-3" />
                          Неактивен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">Пользователей пока нет</div>
          )}
        </div>
      </main>
    </div>
  )
}

function UserForm({
  user,
  onClose,
  onSave,
}: {
  user: KeycloakUser | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'admin',
    permissions: user?.permissions || [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePermissionToggle = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = user ? `/api/keycloak/users/${user.id}` : '/api/keycloak/users'
      const method = user ? 'PATCH' : 'POST'

      const body = user
        ? {
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            permissions: formData.permissions,
            ...(formData.password && { password: formData.password }),
          }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при сохранении')
      }

      alert(user ? 'Пользователь успешно обновлен' : 'Пользователь успешно создан')
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
            {user ? 'Редактировать пользователя' : 'Создать пользователя Keycloak'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!user && (
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2">Имя</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Фамилия</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                {user ? 'Новый пароль (оставьте пустым, если не хотите менять)' : 'Пароль'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required={!user}
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Минимум 8 символов</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Роль</label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Super Admin имеет полный доступ ко всем разделам
              </p>
            </div>

            {formData.role === 'admin' && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-semibold mb-3">
                  Доступ к разделам админки
                </label>
                <div className="space-y-2">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{permission.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Выберите, какие разделы будут доступны этому администратору
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-red-100 text-red-800 text-sm">{error}</div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-medium shadow-md"
              >
                {loading ? 'Сохранение...' : user ? 'Сохранить' : 'Создать'}
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
