'use client'

import { useState, useEffect } from 'react'
import DashboardCards from '@/components/DashboardCards'
import DashboardCharts from '@/components/DashboardCharts'
import FeedbackTable from '@/components/FeedbackTable'
import PageViewStats from '@/components/PageViewStats'
import AdminAccountsPanel from '@/components/AdminAccountsPanel'
import toast, { Toaster } from 'react-hot-toast'

interface Stats {
  total: number
  avgRating: number
  positivoPercent: string
  negativoPercent: string
  sentimentBreakdown: {
    positivo: number
    negativo: number
    neutro: number
  }
  clinicRatingDistribution: Array<{
    rating: number
    total: number
  }>
}

interface DentistPerformance {
  dentistName: string
  total: number
  avgRating: number
  aproveitamento: string
  sentimentBreakdown: {
    positivo: number
    negativo: number
    neutro: number
  }
}

interface Feedback {
  id: string
  rating: number
  comment: string | null
  dentist_name: string | null
  dentist_rating: number | null
  dentist_comment: string | null
  dentist_sentiment: 'positivo' | 'negativo' | 'neutro' | null
  sentiment: 'positivo' | 'negativo' | 'neutro' | null
  created_at: string
  patient_name: string | null
  is_anonymous: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [evolution, setEvolution] = useState<Array<{ date: string; media: string }>>([])
  const [dentistPerformance, setDentistPerformance] = useState<DentistPerformance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSentiment, setSelectedSentiment] = useState('todos')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Buscar estatísticas
        const statsResponse = await fetch('/api/admin/stats')
        if (!statsResponse.ok) throw new Error('Erro ao buscar estatísticas')
        const statsData = await statsResponse.json()
        setStats(statsData)

        // Buscar evolução
        const evolutionResponse = await fetch('/api/admin/evolution')
        if (!evolutionResponse.ok) throw new Error('Erro ao buscar evolução')
        const evolutionData = await evolutionResponse.json()
        setEvolution(evolutionData)

        const dentistResponse = await fetch('/api/admin/dentist-performance')
        if (!dentistResponse.ok) throw new Error('Erro ao buscar dados por dentista')
        const dentistData = await dentistResponse.json()
        setDentistPerformance(dentistData)

        // Buscar feedbacks
        await handleFilter('todos')
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        toast.error('Erro ao carregar dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleFilter = async (sentiment: string) => {
    try {
      let query = ''
      const params = new URLSearchParams()

      if (sentiment !== 'todos') {
        params.append('sentiment', sentiment)
      }

      if (dateFrom) {
        params.append('dateFrom', dateFrom)
      }

      if (dateTo) {
        params.append('dateTo', dateTo)
      }

      if (params.toString()) {
        query = `?${params.toString()}`
      }

      const response = await fetch(`/api/admin/feedbacks${query}`)
      if (!response.ok) throw new Error('Erro ao buscar feedbacks')
      const data = await response.json()
      setFeedbacks(data)
      setSelectedSentiment(sentiment)
    } catch (error) {
      console.error('Erro ao filtrar feedbacks:', error)
      toast.error('Erro ao filtrar feedbacks')
    }
  }

  const handleDateChange = async () => {
    try {
      const params = new URLSearchParams()

      if (selectedSentiment !== 'todos') {
        params.append('sentiment', selectedSentiment)
      }

      if (dateFrom) {
        params.append('dateFrom', dateFrom)
      }

      if (dateTo) {
        params.append('dateTo', dateTo)
      }

      let query = ''
      if (params.toString()) {
        query = `?${params.toString()}`
      }

      const response = await fetch(`/api/admin/feedbacks${query}`)
      if (!response.ok) throw new Error('Erro ao buscar feedbacks')
      const data = await response.json()
      setFeedbacks(data)
    } catch (error) {
      console.error('Erro ao filtrar por data:', error)
      toast.error('Erro ao filtrar por data')
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Erro ao carregar dados do dashboard</p>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-center" />
      <div>
        <section className="mb-8 rounded-[32px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,250,243,0.66))] p-6 shadow-[0_24px_60px_rgba(21,58,91,0.1)] backdrop-blur md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Visão Executiva</p>
          <h2 className="mt-3 text-4xl font-semibold text-[var(--color-primary)]">Dashboard de Feedback</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] md:text-base">
            Monitore satisfação, comentários recentes, evolução das notas e atividade da página em um ambiente visual mais alinhado à identidade institucional.
          </p>
        </section>

        <AdminAccountsPanel />

        {/* Cards de Estatísticas */}
        <DashboardCards
          avgRating={stats.avgRating}
          total={stats.total}
          positivoPercent={stats.positivoPercent}
          negativoPercent={stats.negativoPercent}
        />

        {/* Gráficos */}
        <DashboardCharts
          sentimentBreakdown={stats.sentimentBreakdown}
          clinicRatingDistribution={stats.clinicRatingDistribution}
          evolution={evolution}
          dentistPerformance={dentistPerformance}
        />

        {/* Estatísticas de Visitantes */}
        <PageViewStats
          dateFrom={dateFrom}
          dateTo={dateTo}
          onFiltersChange={(from, to) => {
            setDateFrom(from)
            setDateTo(to)
          }}
        />

        {/* Filtro de Data */}
        <div className="rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.82)] p-6 shadow-[0_18px_44px_rgba(21,58,91,0.08)] mb-6">
          <h3 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">Filtrar por Data</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-[var(--text-soft)] mb-2">Data Inicial</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-3 border border-[rgba(21,58,91,0.12)] rounded-2xl bg-[rgba(255,250,243,0.8)] focus:outline-none focus:ring-4 focus:ring-[rgba(181,138,87,0.12)]"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-[var(--text-soft)] mb-2">Data Final</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-4 py-3 border border-[rgba(21,58,91,0.12)] rounded-2xl bg-[rgba(255,250,243,0.8)] focus:outline-none focus:ring-4 focus:ring-[rgba(181,138,87,0.12)]"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={handleDateChange}
                className="px-6 py-3 rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),#245783)] text-white font-semibold shadow-[0_16px_30px_rgba(21,58,91,0.2)] transition-all hover:-translate-y-0.5"
              >
                Aplicar Filtro
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Feedbacks */}
        <FeedbackTable feedbacks={feedbacks} onFilter={handleFilter} />
      </div>
    </>
  )
}
