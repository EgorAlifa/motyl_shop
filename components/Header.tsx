'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fish, ShoppingCart, Menu, X } from 'lucide-react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Главная' },
    { href: '/catalog', label: 'Каталог' },
    { href: '/about', label: 'О нас' },
    { href: '/delivery', label: 'Доставка' },
    { href: '/contacts', label: 'Контакты' },
  ]

  return (
    <>
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary">
              <Fish className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="hidden xs:inline">Магазин Мотыля</span>
              <span className="xs:hidden">Мотыль</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition font-medium ${
                    pathname === link.href
                      ? 'text-primary'
                      : 'text-gray-700 hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/cart"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline">Корзина</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg sticky top-[73px] z-40">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg transition font-medium ${
                  pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
