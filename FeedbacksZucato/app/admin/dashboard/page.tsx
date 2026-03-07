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
      const query = sentiment !== 'todos' ? `?sentiment=${sentiment}` : ''
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

        {/* Tabela de Feedbacks */}
        <FeedbackTable feedbacks={feedbacks} onFilter={handleFilter} />
      </div>
    </>
  )
}
