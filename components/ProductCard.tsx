import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, categoryNames } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    description: string
    price: number
    stock: number
    unit: string
    category: string
    image: string | null
  }
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden border border-gray-100 group-hover:-translate-y-1">
        <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <span className="text-7xl">🦐</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm">
              {categoryNames[product.category] || product.category}
            </span>
          </div>
          {product.stock > 0 && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1.5 bg-green-500/90 text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                ✓ В наличии
              </span>
            </div>
          )}
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-100">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {formatPrice(product.price)}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                за {product.unit}
              </div>
            </div>

            <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold group-hover:shadow-lg transition-all">
              Подробнее →
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
