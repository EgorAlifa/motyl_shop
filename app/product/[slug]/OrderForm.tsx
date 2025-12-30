'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Loader2 } from 'lucide-react'

interface OrderFormProps {
  product: {
    id: string
    name: string
    price: number
    unit: string
    minOrder: number
  }
}

export function OrderForm({ product }: OrderFormProps) {
  const [quantity, setQuantity] = useState(product.minOrder)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryDate: '',
    comment: '',
  })

  const totalPrice = quantity * product.price

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: [
            {
              productId: product.id,
              quantity,
            },
          ],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании заявки')
      }

      setSuccess(true)
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        deliveryAddress: '',
        deliveryDate: '',
        comment: '',
      })
      setQuantity(product.minOrder)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
        <h3 className="text-xl font-semibold text-green-900 mb-2">
          Заявка успешно отправлена!
        </h3>
        <p className="text-green-800 mb-4">
          Мы отправили подтверждение на вашу почту и свяжемся с вами в ближайшее время.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          Оформить еще одну заявку
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border-t pt-6">
      <h2 className="text-2xl font-semibold mb-6">Оформить заявку</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Количество ({product.unit})
        </label>
        <input
          type="number"
          min={product.minOrder}
          step={10}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || product.minOrder)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
        <p className="text-sm text-gray-600 mt-1">
          Минимальный заказ: {product.minOrder} {product.unit}
        </p>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold">Итого:</span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(totalPrice)}
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Ваше имя *
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) =>
              setFormData({ ...formData, customerEmail: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Телефон *
          </label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) =>
              setFormData({ ...formData, customerPhone: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="+7 (999) 123-45-67"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Адрес доставки *
          </label>
          <textarea
            value={formData.deliveryAddress}
            onChange={(e) =>
              setFormData({ ...formData, deliveryAddress: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Желаемая дата доставки
          </label>
          <input
            type="date"
            value={formData.deliveryDate}
            onChange={(e) =>
              setFormData({ ...formData, deliveryDate: e.target.value })
            }
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Комментарий
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) =>
              setFormData({ ...formData, comment: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
            placeholder="Дополнительные пожелания к заказу..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Отправка...
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Отправить заявку
          </>
        )}
      </button>
    </form>
  )
}
