import { ReactNode } from 'react'
import { AdminNav } from './components/AdminNav'

export const metadata = {
  title: 'Админ-панель - Магазин Мотыля',
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
