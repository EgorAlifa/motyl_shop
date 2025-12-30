'use client'

import { useEffect, useState } from 'react'
import { AdminNav } from '../components/AdminNav'
import { formatPrice, formatDate, orderStatusNames, orderStatusColors } from '@/lib/utils'
import { Eye, Trash2 } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить заявку?')) return

    try {
      await fetch(`/api/orders/${id}`, { method: 'DELETE' })
      fetchOrders()
    } catch (error) {
      console.error('Failed to delete order:', error)
      alert('Ошибка при удалении заявки')
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchOrders()
    } catch (error) {
      console.error('Failed to update order:', error)
      alert('Ошибка при обновлении статуса')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Заявки</h1>

        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.customerName}
                    </div>
                    <div className="text-sm text-gray-500">{order.customerEmail}</div>
                    <div className="text-sm text-gray-500">{order.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        orderStatusColors[order.status]
                      }`}
                    >
                      {orderStatusNames[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">Заявок пока нет</div>
          )}
        </div>
      </main>
    </div>
  )
}

function OrderDetails({
  order,
  onClose,
  onUpdateStatus,
}: {
  order: any
  onClose: () => void
  onUpdateStatus: (id: string, status: string) => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Заявка #{order.orderNumber}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Информация о клиенте</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Имя</div>
                  <div className="font-medium">{order.customerName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{order.customerEmail}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Телефон</div>
                  <div className="font-medium">{order.customerPhone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Дата заявки</div>
                  <div className="font-medium">{formatDate(order.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Доставка</h3>
              <div>
                <div className="text-sm text-gray-600">Адрес</div>
                <div className="font-medium">{order.deliveryAddress}</div>
              </div>
              {order.deliveryDate && (
                <div className="mt-2">
                  <div className="text-sm text-gray-600">Желаемая дата</div>
                  <div className="font-medium">
                    {new Date(order.deliveryDate).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              )}
            </div>

            {/* Comment */}
            {order.comment && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Комментарий</h3>
                <div className="p-4 bg-gray-50 rounded-lg">{order.comment}</div>
              </div>
            )}

            {/* Items */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Состав заказа</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Товар
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Количество
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Цена
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Сумма
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">{item.product.name}</td>
                      <td className="px-4 py-3">
                        {item.quantity} {item.product.unit}
                      </td>
                      <td className="px-4 py-3">{formatPrice(item.price)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatPrice(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                      Итого:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-lg text-primary">
                      {formatPrice(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Статус заявки</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(orderStatusNames).map(([status, name]) => (
                  <button
                    key={status}
                    onClick={() => {
                      onUpdateStatus(order.id, status)
                      onClose()
                    }}
                    className={`px-4 py-2 rounded-lg transition ${
                      order.status === status
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
