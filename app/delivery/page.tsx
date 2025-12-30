import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Truck, CreditCard, Package, Shield } from 'lucide-react'

export default function DeliveryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-8 text-center">Доставка и оплата</h1>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Delivery */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold">Доставка</h2>
              </div>

              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Условия доставки
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Доставка осуществляется в специальных термоконтейнерах</li>
                    <li>Соблюдаем температурный режим 0-4°C во время транспортировки</li>
                    <li>Доставка по Москве - от 300 рублей</li>
                    <li>Доставка в регионы - рассчитывается индивидуально</li>
                    <li>Бесплатная доставка при заказе от 5000 рублей</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Сроки доставки
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>По Москве - 1-2 дня</li>
                    <li>Московская область - 2-3 дня</li>
                    <li>Регионы России - 3-7 дней</li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm">
                    <strong>Важно:</strong> При получении заказа обязательно проверьте
                    состояние наживки. Если есть претензии к качеству товара,
                    сообщите об этом курьеру немедленно.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold">Оплата</h2>
              </div>

              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Способы оплаты
                  </h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Наличными курьеру при получении</li>
                    <li>Банковской картой при получении (терминал у курьера)</li>
                    <li>Безналичный расчет для юридических лиц</li>
                    <li>Перевод на карту (после согласования)</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <p className="text-sm">
                    <strong>Примечание:</strong> Онлайн-касса не предусмотрена.
                    Все операции проводятся через заявки и прямую связь с менеджером.
                  </p>
                </div>
              </div>
            </div>

            {/* Returns */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-semibold">Возврат и обмен</h2>
              </div>

              <div className="space-y-4 text-gray-700">
                <p>
                  Учитывая специфику товара (живая наживка), возврат и обмен
                  возможны только в случае:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Получения товара ненадлежащего качества</li>
                  <li>Несоответствия товара заказу</li>
                  <li>Нарушения условий хранения при доставке</li>
                </ul>
                <p>
                  О проблемах с качеством товара необходимо сообщить в момент
                  получения заказа у курьера или в течение 2 часов после получения.
                </p>
              </div>
            </div>

            {/* Guarantees */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold">Гарантии качества</h2>
              </div>

              <div className="space-y-4 text-gray-700">
                <ul className="list-disc list-inside space-y-2">
                  <li>Гарантируем свежесть товара</li>
                  <li>Соблюдаем все нормы хранения и транспортировки</li>
                  <li>Проверяем качество перед отправкой</li>
                  <li>Предоставляем рекомендации по хранению</li>
                  <li>Готовы заменить товар при обнаружении брака</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
