import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductCard } from '@/components/ProductCard'
import { prisma } from '@/lib/prisma'
import { ArrowRight, Snowflake, Award, Truck } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { isActive: true },
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-24">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold mb-6">
                🎣 Профессиональная наживка для рыбалки
              </div>
              <h1 className="text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                Живая наживка для успешной рыбалки
              </h1>
              <p className="text-xl mb-8 text-blue-100 leading-relaxed">
                Качественный мотыль и коретра с доставкой.
                Работаем с соблюдением температурного режима для максимальной свежести.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  Перейти в каталог
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 border border-white/30 transition-all duration-200"
                >
                  Узнать больше
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Snowflake className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Правильное хранение</h3>
                <p className="text-gray-600 leading-relaxed">
                  Соблюдаем температурный режим 0-4°C для максимальной свежести и долговечности
                </p>
              </div>

              <div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Высокое качество</h3>
                <p className="text-gray-600 leading-relaxed">
                  Только отборный живой мотыль и коретра высшего качества от проверенных поставщиков
                </p>
              </div>

              <div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                  <Truck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Быстрая доставка</h3>
                <p className="text-gray-600 leading-relaxed">
                  Доставляем в специальных контейнерах с соблюдением температурного режима
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Популярные товары</h2>
              <Link
                href="/catalog"
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
              >
                Все товары
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Готовы к успешной рыбалке?
            </h2>
            <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Закажите качественную наживку прямо сейчас и получите гарантию свежести
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Выбрать товары
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
