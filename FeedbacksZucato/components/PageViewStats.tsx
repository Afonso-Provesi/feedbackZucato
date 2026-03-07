'use client'

import { useState, useEffect } from 'react'

interface PageViewStats {
  total: number
  byDate: { [key: string]: number }
  page: string
}

interface PageViewStatsProps {
  dateFrom: string
  dateTo: string
  onFiltersChange: (from: string, to: string) => void
}

export default function PageViewStats({
  dateFrom,
  dateTo,
  onFiltersChange,
}: PageViewStatsProps) {
  const [stats, setStats] = useState<PageViewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()

      if (dateFrom) {
        params.append('dateFrom', dateFrom)
      }

      if (dateTo) {
        params.append('dateTo', dateTo)
      }

      params.append('page', 'index')

      const query = params.toString() ? `?${params.toString()}` : ''
      const response = await fetch(`/api/admin/page-views${query}`)

      if (!response.ok) throw new Error('Erro ao buscar estatísticas')

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Erro ao buscar page views:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [dateFrom, dateTo])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600">Carregando estatísticas...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Visitantes</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estatística Total */}
        <div className="border-l-4 border-brand-blue pl-4">
          <p className="text-gray-600 text-sm font-semibold mb-2">Total de Visitas</p>
          <p className="text-3xl font-bold text-brand-blue">{stats?.total || 0}</p>
          <p className="text-gray-400 text-xs mt-2">pessoas acessaram</p>
        </div>

        {/* Visitas por Data */}
        {stats && Object.keys(stats.byDate).length > 0 && (
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-gray-600 text-sm font-semibold mb-2">Distribuição por Dia</p>
            <div className="space-y-1">
              {Object.entries(stats.byDate)
                .slice(0, 5)
                .map(([date, count]) => (
                  <div key={date} className="flex justify-between text-sm">
                    <span className="text-gray-600">{date}</span>
                    <span className="font-semibold text-gray-800">{count}</span>
                  </div>
                ))}
            </div>
            {Object.keys(stats.byDate).length > 5 && (
              <p className="text-gray-400 text-xs mt-2">
                +{Object.keys(stats.byDate).length - 5} outros dias
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
