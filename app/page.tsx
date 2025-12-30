import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductCard } from '@/components/ProductCard'
import { prisma } from '@/lib/prisma'
import { ArrowRight, Snowflake, Award, Truck } from 'lucide-react'

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { isActive: true },
    take: 6,
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold mb-6">
                Живая наживка для успешной рыбалки
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Качественный мотыль и коретра с доставкой.
                Работаем с соблюдением температурного режима.
              </p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                Перейти в каталог
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <Snowflake className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Правильное хранение</h3>
                <p className="text-gray-600">
                  Соблюдаем температурный режим 0-4°C для максимальной свежести
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Высокое качество</h3>
                <p className="text-gray-600">
                  Только отборный живой мотыль и коретра высшего качества
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <Truck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Быстрая доставка</h3>
                <p className="text-gray-600">
                  Доставляем в специальных контейнерах с соблюдением температуры
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
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Готовы к успешной рыбалке?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Закажите качественную наживку прямо сейчас
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
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
