import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Магазин Мотыля - Живая наживка для рыбалки',
  description: 'Продажа живого мотыля и коретры для рыбалки. Быстрая доставка. Высокое качество.',
  keywords: 'мотыль, коретра, рыбалка, наживка, живая наживка, купить мотыль',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
