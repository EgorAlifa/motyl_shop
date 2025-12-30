import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

export default function ContactsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-8 text-center">Контакты</h1>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-semibold mb-6">Свяжитесь с нами</h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Phone className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Телефон</div>
                      <a
                        href="tel:+79991234567"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        +7 (999) 123-45-67
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Email</div>
                      <a
                        href="mailto:info@motyl-shop.ru"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        info@motyl-shop.ru
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Адрес</div>
                      <div className="text-gray-700">
                        Москва, Россия
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Режим работы</div>
                      <div className="text-gray-700">
                        Пн-Пт: 9:00 - 18:00
                        <br />
                        Сб-Вс: 10:00 - 16:00
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-semibold mb-6">Часто задаваемые вопросы</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Как сделать заказ?
                    </h3>
                    <p className="text-gray-700 text-sm">
                      Выберите нужные товары в каталоге, заполните форму заказа
                      и отправьте заявку. Мы свяжемся с вами для подтверждения.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Какие способы оплаты доступны?
                    </h3>
                    <p className="text-gray-700 text-sm">
                      После согласования заказа мы сообщим вам удобные способы оплаты.
                      Возможна оплата при получении или безналичный расчет.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Как долго хранится мотыль?
                    </h3>
                    <p className="text-gray-700 text-sm">
                      При правильном хранении при температуре 0-4°C мотыль может
                      храниться от 7 до 20 дней в зависимости от вида.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Доставляете ли вы в регионы?
                    </h3>
                    <p className="text-gray-700 text-sm">
                      Да, мы организуем доставку по всей России с соблюдением
                      температурного режима. Условия доставки обсуждаются индивидуально.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Остались вопросы?
              </h2>
              <p className="text-blue-100 mb-6">
                Свяжитесь с нами любым удобным способом,
                и мы с радостью вам поможем!
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href="tel:+79991234567"
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Позвонить
                </a>
                <a
                  href="mailto:info@motyl-shop.ru"
                  className="px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition"
                >
                  Написать
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
