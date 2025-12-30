import { AdminNav } from './components/AdminNav'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'

export default async function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Дашборд</h1>
        <AnalyticsDashboard />
      </main>
    </div>
  )
}
