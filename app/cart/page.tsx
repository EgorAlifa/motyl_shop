import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-8 text-center">Корзина</h1>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <ShoppingCart className="h-10 w-10 text-gray-400" />
              </div>

              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                Корзина не используется
              </h2>

              <p className="text-gray-600 mb-8">
                Заказ оформляется напрямую со страницы товара.
                Выберите нужный товар и заполните форму заявки.
              </p>

              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Перейти в каталог
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
