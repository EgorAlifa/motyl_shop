import { AnalyticsDashboard } from './components/AnalyticsDashboard'
import { LayoutDashboard } from 'lucide-react'

export default async function AdminPage() {
  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
          <LayoutDashboard className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Панель управления
        </h1>
      </div>
      <AnalyticsDashboard />
    </>
  )
}
