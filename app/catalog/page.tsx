import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductCard } from '@/components/ProductCard'
import { prisma } from '@/lib/prisma'
import { categoryNames } from '@/lib/utils'

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const category = searchParams.category

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category && { category: category as any }),
    },
    orderBy: { name: 'asc' },
  })

  const categories = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Каталог товаров</h1>

          {/* Category Filter */}
          <div className="mb-8 flex flex-wrap gap-2">
            <a
              href="/catalog"
              className={`px-4 py-2 rounded-lg transition ${
                !category
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Все товары
            </a>
            {categories.map((cat) => (
              <a
                key={cat.category}
                href={`/catalog?category=${cat.category}`}
                className={`px-4 py-2 rounded-lg transition ${
                  category === cat.category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {categoryNames[cat.category] || cat.category}
              </a>
            ))}
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">Товары не найдены</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
