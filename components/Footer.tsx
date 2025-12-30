import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Магазин Мотыля</h3>
            <p className="text-sm">
              Продажа живого мотыля и коретры для рыбалки.
              Гарантируем свежесть и качество наживки.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4">Контакты</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+7 (999) 123-45-67</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@motyl-shop.ru</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Москва, Россия</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4">Информация</h3>
            <div className="space-y-2 text-sm">
              <Link href="/about" className="block hover:text-white transition">
                О компании
              </Link>
              <Link href="/delivery" className="block hover:text-white transition">
                Доставка и оплата
              </Link>
              <Link href="/contacts" className="block hover:text-white transition">
                Контакты
              </Link>
              <Link href="/admin" className="block hover:text-white transition">
                Админ-панель
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Магазин Мотыля. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}
