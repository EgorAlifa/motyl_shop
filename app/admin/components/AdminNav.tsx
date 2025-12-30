'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fish, LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const links = [
    {
      href: '/admin',
      label: 'Дашборд',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/products',
      label: 'Товары',
      icon: Package,
    },
    {
      href: '/admin/orders',
      label: 'Заявки',
      icon: ShoppingCart,
    },
  ]

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2 text-xl font-bold text-primary">
              <Fish className="h-6 w-6" />
              <span>Админ-панель</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-gray-700 hover:text-primary transition text-sm"
            >
              Перейти на сайт
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
