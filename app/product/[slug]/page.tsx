import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/prisma'
import { formatPrice, categoryNames } from '@/lib/utils'
import { OrderForm } from './OrderForm'
import { Package, Snowflake, Info } from 'lucide-react'

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  })

  if (!product || !product.isActive) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Product Image */}
              <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-9xl">🦐</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                <div className="mb-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                    {categoryNames[product.category] || product.category}
                  </span>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                <div className="mb-6">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {formatPrice(product.price)}
                    <span className="text-xl text-gray-500 ml-2">
                      / {product.unit}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Минимальный заказ: {product.minOrder} {product.unit}
                  </div>
                </div>

                <div className="mb-6">
                  {product.stock > 0 ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Package className="h-5 w-5" />
                      <span className="font-semibold">В наличии ({product.stock} {product.unit})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <Package className="h-5 w-5" />
                      <span className="font-semibold">Нет в наличии</span>
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Описание
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-blue-900">
                    <Snowflake className="h-5 w-5" />
                    Условия хранения
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.storage}
                  </p>
                </div>

                {product.stock > 0 && (
                  <OrderForm product={product} />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
