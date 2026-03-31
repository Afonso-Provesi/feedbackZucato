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
      <div className="rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.82)] p-6 shadow-[0_18px_44px_rgba(21,58,91,0.08)] mb-6">
        <p className="text-[var(--text-soft)]">Carregando estatísticas...</p>
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.82)] p-6 shadow-[0_18px_44px_rgba(21,58,91,0.08)] mb-6">
      <h3 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">Visitantes</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(21,58,91,0.14),rgba(21,58,91,0.04))] p-5">
          <p className="text-[var(--text-soft)] text-sm font-semibold mb-2">Total de Visitas</p>
          <p className="text-4xl font-semibold text-[var(--color-primary)]">{stats?.total || 0}</p>
          <p className="text-[var(--text-soft)] text-xs mt-2 uppercase tracking-[0.16em]">pessoas acessaram</p>
        </div>

        {stats && Object.keys(stats.byDate).length > 0 && (
          <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(34,197,94,0.12),rgba(34,197,94,0.04))] p-5">
            <p className="text-[var(--text-soft)] text-sm font-semibold mb-2">Distribuição por Dia</p>
            <div className="space-y-1">
              {Object.entries(stats.byDate)
                .slice(0, 5)
                .map(([date, count]) => (
                  <div key={date} className="flex justify-between text-sm">
                    <span className="text-[var(--text-soft)]">{date}</span>
                    <span className="font-semibold text-[var(--color-primary)]">{count}</span>
                  </div>
                ))}
            </div>
            {Object.keys(stats.byDate).length > 5 && (
              <p className="text-[var(--text-soft)] text-xs mt-2">
                +{Object.keys(stats.byDate).length - 5} outros dias
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
