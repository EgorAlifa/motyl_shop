'use client'

import { useEffect, useState, useCallback } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatPrice, orderStatusNames } from '@/lib/utils'
import { TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react'

interface Stats {
  totalOrders: number
  recentOrders: number
  totalCompletedOrders: number
  recentCompletedOrders: number
  totalRevenue: number
  recentRevenue: number
  ordersByStatus: Array<{ status: string; _count: { status: number } }>
  topProducts: Array<{
    product: any
    totalQuantity: number
    orderCount: number
  }>
  dailyOrders: Array<{
    date: string
    orders: number
    completedOrders: number
    revenue: number
  }>
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30) // дни: 7, 30, 90, 365, 0 (все время)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const url = period === 0
        ? '/api/stats?days=10000' // Большое число для "всего времени"
        : `/api/stats?days=${period}`
      const response = await fetch(url)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        Не удалось загрузить статистику
      </div>
    )
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 7: return '7 дней'
      case 30: return '30 дней'
      case 90: return '90 дней'
      case 365: return '1 год'
      case 0: return 'Все время'
      default: return `${period} дней`
    }
  }

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Период:</span>
            <div className="flex gap-2">
              {[
                { value: 7, label: '7 дней' },
                { value: 30, label: '30 дней' },
                { value: 90, label: '90 дней' },
                { value: 365, label: '1 год' },
                { value: 0, label: 'Все время' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    period === option.value
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-100 group hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            {stats.recentOrders}
          </div>
          <div className="text-sm font-semibold text-gray-700 mt-2">
            Всего заявок за {getPeriodLabel().toLowerCase()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Выполнено: {stats.recentCompletedOrders} • Всего: {stats.totalOrders}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-100 group hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
            {formatPrice(stats.recentRevenue)}
          </div>
          <div className="text-sm font-semibold text-gray-700 mt-2">
            Выручка за {getPeriodLabel().toLowerCase()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Из {stats.recentCompletedOrders} выполненных • Всего: {formatPrice(stats.totalRevenue)}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 group hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            {stats.recentCompletedOrders > 0
              ? formatPrice(stats.recentRevenue / stats.recentCompletedOrders)
              : formatPrice(0)}
          </div>
          <div className="text-sm font-semibold text-gray-700 mt-2">Средний чек</div>
          <div className="text-xs text-gray-500 mt-1">
            По выполненным заявкам за {getPeriodLabel().toLowerCase()}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-orange-100 group hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            {stats.ordersByStatus.find((s) => s.status === 'NEW')?._count.status || 0}
          </div>
          <div className="text-sm font-semibold text-gray-700 mt-2">Новых заявок</div>
          <div className="text-xs text-gray-500 mt-1">
            Требуют обработки
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Заявки по дням</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getDate()}/${date.getMonth() + 1}`
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('ru-RU')
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#94a3b8"
                name="Всего заявок"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="completedOrders"
                stroke="#10b981"
                name="Выполнено"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Revenue */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Выручка по дням</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getDate()}/${date.getMonth() + 1}`
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('ru-RU')
                }}
                formatter={(value: number) => formatPrice(value)}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Выручка (₽)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders by Status & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Заявки по статусам</h2>
          <div className="space-y-3">
            {stats.ordersByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-gray-700">
                  {orderStatusNames[item.status] || item.status}
                </span>
                <span className="font-semibold text-gray-900">
                  {item._count.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Топ товаров</h2>
          <div className="space-y-4">
            {stats.topProducts.map((item, index) => (
              <div key={item.product?.id || index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {item.product?.name || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.totalQuantity} {item.product?.unit} • {item.orderCount} заявок
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
