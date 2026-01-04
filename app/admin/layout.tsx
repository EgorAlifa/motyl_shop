import { ReactNode } from 'react'
import { AdminNav } from './components/AdminNav'
import { SessionSync } from './components/SessionSync'

export const metadata = {
  title: 'Админ-панель - Магазин Мотыля',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SessionSync />
      <AdminNav />
      <main className="container mx-auto p-4">{children}</main>
    </div>
  )
}
