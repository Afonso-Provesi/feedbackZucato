'use client'

import { useState, useEffect } from 'react'
import DashboardCards from '@/components/DashboardCards'
import DashboardCharts from '@/components/DashboardCharts'
import FeedbackTable from '@/components/FeedbackTable'
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
}

interface Feedback {
  id: string
  rating: number
  comment: string | null
  sentiment: 'positivo' | 'negativo' | 'neutro' | null
  created_at: string
  patient_name: string | null
  is_anonymous: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [evolution, setEvolution] = useState<Array<{ date: string; media: string }>>([])
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
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard de Feedback</h2>

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
          evolution={evolution}
        />

        {/* Filtro de Data */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por Data</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-2">Data Inicial</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-600 mb-2">Data Final</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={handleDateChange}
                className="px-6 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all"
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
