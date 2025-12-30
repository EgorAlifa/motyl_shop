'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatPrice, orderStatusNames } from '@/lib/utils'
import { TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react'

interface Stats {
  totalOrders: number
  recentOrders: number
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
    revenue: number
  }>
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.recentOrders}
          </div>
          <div className="text-sm text-gray-600">Заявок за 30 дней</div>
          <div className="text-xs text-gray-500 mt-1">
            Всего: {stats.totalOrders}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatPrice(stats.recentRevenue)}
          </div>
          <div className="text-sm text-gray-600">Выручка за 30 дней</div>
          <div className="text-xs text-gray-500 mt-1">
            Всего: {formatPrice(stats.totalRevenue)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.recentOrders > 0
              ? formatPrice(stats.recentRevenue / stats.recentOrders)
              : formatPrice(0)}
          </div>
          <div className="text-sm text-gray-600">Средний чек</div>
          <div className="text-xs text-gray-500 mt-1">
            За последние 30 дней
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.ordersByStatus.find((s) => s.status === 'NEW')?._count.status || 0}
          </div>
          <div className="text-sm text-gray-600">Новых заявок</div>
          <div className="text-xs text-gray-500 mt-1">
            Требуют обработки
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Заявки по дням</h2>
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
                stroke="#3b82f6"
                name="Заявки"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Выручка по дням</h2>
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Заявки по статусам</h2>
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Топ товаров</h2>
          <div className="space-y-4">
            {stats.topProducts.map((item, index) => (
              <div key={item.product?.id || index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
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
