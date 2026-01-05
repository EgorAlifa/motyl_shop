import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductCard } from '@/components/ProductCard'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const categorySlug = searchParams.category

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(categorySlug && {
        category: {
          slug: categorySlug,
        },
      }),
    },
    include: {
      category: true, // Включаем связанную категорию
    },
    orderBy: { name: 'asc' },
  })

  // Получаем все активные категории
  const categories = await prisma.productCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-5xl font-bold mb-4">Каталог товаров</h1>
            <p className="text-xl text-blue-100">
              Выбирайте качественную наживку для успешной рыбалки
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Category Filter */}
          <div className="mb-8 flex flex-wrap gap-3">
            <a
              href="/catalog"
              className={`px-6 py-3 rounded-xl font-medium transition-all shadow-sm ${
                !categorySlug
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              Все товары
            </a>
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`/catalog?category=${cat.slug}`}
                className={`px-6 py-3 rounded-xl font-medium transition-all shadow-sm ${
                  categorySlug === cat.slug
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {cat.name}
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
