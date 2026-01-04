'use client'

import { useEffect, useState } from 'react'
import { formatPrice, categoryNames } from '@/lib/utils'
import { Plus, Edit, Trash2, Check, X } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар?')) return

    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      fetchProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Ошибка при удалении товара')
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  const handleSave = () => {
    fetchProducts()
    handleCloseForm()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Товары</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            <Plus className="h-5 w-5" />
            Добавить товар
          </button>
        </div>

        {showForm && (
          <ProductForm
            product={editingProduct}
            onClose={handleCloseForm}
            onSave={handleSave}
          />
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Товар
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Остаток
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
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {categoryNames[product.category] || product.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatPrice(product.price)} / {product.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {product.stock} {product.unit}
                  </td>
                  <td className="px-6 py-4">
                    {product.isActive ? (
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
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  )
}

function ProductForm({
  product,
  onClose,
  onSave,
}: {
  product: any
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState(
    product || {
      name: '',
      slug: '',
      description: '',
      price: 0,
      stock: 0,
      unit: 'г',
      minOrder: 50,
      category: 'MOTYL',
      storage: '',
      image: '',
      isActive: true,
    }
  )
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState(product?.image || '')
  const [imageInputType, setImageInputType] = useState<'url' | 'upload'>('upload')

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^а-яёa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки')
      }

      setFormData((prev: any) => ({ ...prev, image: data.url }))
      setImagePreview(data.url)
    } catch (error: any) {
      alert(error.message || 'Ошибка при загрузке изображения')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save product')
      }

      onSave()
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('Ошибка при сохранении товара')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {product ? 'Редактировать товар' : 'Добавить товар'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Название</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Slug (URL)
                  <span className="text-xs text-gray-500 ml-2">(генерируется автоматически)</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Цена (₽)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Остаток</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Единица</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Мин. заказ</label>
                <input
                  type="number"
                  value={formData.minOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, minOrder: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Категория</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="MOTYL">Мотыль</option>
                  <option value="KORETRA">Коретра</option>
                  <option value="ACCESSORIES">Аксессуары</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Условия хранения</label>
              <textarea
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Изображение товара</label>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-4 relative">
                  <img
                    src={imagePreview}
                    alt="Превью"
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('')
                      setFormData({ ...formData, image: '' })
                    }}
                    className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                  >
                    Удалить
                  </button>
                </div>
              )}

              {/* Toggle between URL and Upload */}
              <div className="mb-4 flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setImageInputType('upload')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                    imageInputType === 'upload'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📁 Загрузить файл
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputType('url')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                    imageInputType === 'url'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🔗 Указать URL
                </button>
              </div>

              {/* Upload File */}
              {imageInputType === 'upload' && (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary hover:bg-primary/5 transition">
                    {uploadingImage ? (
                      <div className="text-gray-600">Загрузка...</div>
                    ) : (
                      <div>
                        <div className="text-primary mb-1">📁 Выбрать файл с компьютера</div>
                        <div className="text-xs text-gray-500">JPG, PNG, WEBP до 5MB</div>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}

              {/* URL Input */}
              {imageInputType === 'url' && (
                <div>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value })
                      setImagePreview(e.target.value)
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Вставьте ссылку на изображение из интернета
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-semibold">
                Товар активен
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
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
