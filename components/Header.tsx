import Link from 'next/link'
import { Fish, ShoppingCart } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Fish className="h-8 w-8" />
            <span>Магазин Мотыля</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-primary transition">
              Главная
            </Link>
            <Link href="/catalog" className="text-gray-700 hover:text-primary transition">
              Каталог
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary transition">
              О нас
            </Link>
            <Link href="/contacts" className="text-gray-700 hover:text-primary transition">
              Контакты
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden md:inline">Корзина</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
