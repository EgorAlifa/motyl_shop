'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fish, LayoutDashboard, Package, ShoppingCart, UserPlus, LogOut, Menu, X, ExternalLink, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    sessionStorage.removeItem('adminData')
    router.push('/')
    router.refresh()
  }

  const [adminRole, setAdminRole] = useState<string | null>(null)

  useEffect(() => {
    // Функция для обновления роли из sessionStorage
    const updateRole = () => {
      const adminData = sessionStorage.getItem('adminData')
      if (adminData) {
        const data = JSON.parse(adminData)
        setAdminRole(data.role)
      }
    }

    // Обновляем роль при монтировании и изменении роута
    updateRole()

    // Слушаем изменения в sessionStorage (срабатывает от SessionSync)
    window.addEventListener('storage', updateRole)

    return () => {
      window.removeEventListener('storage', updateRole)
    }
  }, [pathname])

  // Закрываем меню при смене маршрута
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const links = [
    {
      href: '/admin',
      label: 'Дашборд',
      icon: LayoutDashboard,
      permission: 'dashboard',
    },
    {
      href: '/admin/products',
      label: 'Товары',
      icon: Package,
      permission: 'products',
    },
    {
      href: '/admin/orders',
      label: 'Заявки',
      icon: ShoppingCart,
      permission: 'orders',
    },
    ...(adminRole === 'SUPER_ADMIN'
      ? [
          {
            href: '/admin/keycloak-users',
            label: 'Администраторы',
            icon: Shield,
            permission: 'keycloak',
          },
        ]
      : []),
  ]

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Desktop Nav */}
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2 text-xl font-bold text-white hover:text-blue-100 transition">
                <Fish className="h-6 w-6" />
                <span className="hidden sm:inline">Админ-панель</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                {links.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium',
                        isActive
                          ? 'bg-white/20 text-white shadow-lg'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1 px-3 py-2 text-blue-100 hover:text-white transition text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden lg:inline">На сайт</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Выйти</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium',
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}

            <div className="pt-2 border-t border-white/10 space-y-2">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-white/10 hover:text-white rounded-lg transition font-medium"
              >
                <ExternalLink className="h-5 w-5" />
                <span>Перейти на сайт</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition font-medium"
              >
                <LogOut className="h-5 w-5" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
