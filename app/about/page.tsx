import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Award, Snowflake, Truck, Clock } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-8 text-center">О нас</h1>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Магазин Мотыля</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Мы специализируемся на продаже живой наживки для рыбалки.
                Наш магазин предлагает качественный мотыль и коретру,
                выращенные и хранящиеся с соблюдением всех необходимых условий.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Мы понимаем, насколько важна свежесть и качество наживки для успешной рыбалки,
                поэтому строго контролируем условия хранения и доставки наших товаров.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Высокое качество</h3>
                </div>
                <p className="text-gray-700">
                  Мы работаем только с проверенными поставщиками и
                  тщательно отбираем каждую партию товара.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Snowflake className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Правильное хранение</h3>
                </div>
                <p className="text-gray-700">
                  Соблюдаем температурный режим 0-4°C на всех этапах
                  хранения и транспортировки.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Быстрая доставка</h3>
                </div>
                <p className="text-gray-700">
                  Доставляем заказы в специальных термоконтейнерах
                  с поддержанием необходимой температуры.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Всегда свежее</h3>
                </div>
                <p className="text-gray-700">
                  Регулярное обновление ассортимента гарантирует
                  свежесть наживки для ваших уловов.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Наша миссия</h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                Сделать рыбалку более успешной и приятной,
                предоставляя рыбакам качественную живую наживку
                по доступным ценам с быстрой доставкой.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
