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
    <Link href={`/product/${product.slug}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
        <div className="relative h-48 bg-gray-100">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-6xl">🦐</span>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className="px-3 py-1 bg-primary text-white text-xs rounded-full">
              {categoryNames[product.category] || product.category}
            </span>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {product.name}
          </h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
            {product.description}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(product.price)}
              </div>
              <div className="text-xs text-gray-500">
                за {product.unit}
              </div>
            </div>

            <div className="text-sm text-gray-500">
              {product.stock > 0 ? (
                <span className="text-green-600">В наличии</span>
              ) : (
                <span className="text-red-600">Нет в наличии</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
