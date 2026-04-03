'use client'

import { useState, useEffect } from 'react'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Pie, Line, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface DentistPerformance {
  dentistName: string
  total: number
  avgRating: number
  aproveitamento: string
  sentimentBreakdown: {
    positivo: number
    negativo: number
    neutro: number
    misto: number
  }
}

interface DashboardChartsProps {
  sentimentBreakdown: {
    positivo: number
    negativo: number
    neutro: number
    misto: number
  }
  clinicRatingDistribution: Array<{
    rating: number
    total: number
  }>
  evolution: Array<{
    date: string
    media: string
  }>
  dentistPerformance: DentistPerformance[]
}

export default function DashboardCharts({ sentimentBreakdown, clinicRatingDistribution, evolution, dentistPerformance }: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [selectedDentist, setSelectedDentist] = useState('Todos os dentistas')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!dentistPerformance.some((item) => item.dentistName === selectedDentist) && dentistPerformance.length > 0) {
      setSelectedDentist('Todos os dentistas')
    }
  }, [dentistPerformance, selectedDentist])

  if (!isMounted) {
    return <div className="rounded-[28px] bg-white/80 p-6 shadow-[0_20px_44px_rgba(21,58,91,0.08)]">Carregando gráficos...</div>
  }

  const sentimentData = {
    labels: ['Positivo', 'Misto', 'Mediano', 'Negativo'],
    datasets: [
      {
        data: [sentimentBreakdown.positivo, sentimentBreakdown.misto, sentimentBreakdown.neutro, sentimentBreakdown.negativo],
        backgroundColor: ['#22c55e', '#f59e0b', '#94a3b8', '#ef4444'],
        borderColor: ['#16a34a', '#d97706', '#64748b', '#dc2626'],
        borderWidth: 2,
      },
    ],
  }

  const evolutionData = {
    labels: evolution.map((item) => item.date),
    datasets: [
      {
        label: 'Média de Avaliações',
        data: evolution.map((item) => parseFloat(item.media)),
        borderColor: '#1F1D6B',
        backgroundColor: 'rgba(31, 29, 107, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#B0743C',
        pointBorderColor: '#1F1D6B',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  }

  const clinicRatingData = {
    labels: clinicRatingDistribution.map((item) => `${item.rating}`),
    datasets: [
      {
        label: 'Avaliações da clínica',
        data: clinicRatingDistribution.map((item) => item.total),
        backgroundColor: 'rgba(181, 138, 87, 0.72)',
        borderColor: '#b58a57',
        borderWidth: 1,
        borderRadius: 10,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
  }

  const selectedDentistData = dentistPerformance.find((item) => item.dentistName === selectedDentist) || null

  const dentistSentimentData = selectedDentistData
    ? {
        labels: ['Positivo', 'Misto', 'Mediano', 'Negativo'],
        datasets: [
          {
            label: 'Avaliações do dentista',
            data: [
              selectedDentistData.sentimentBreakdown.positivo,
              selectedDentistData.sentimentBreakdown.misto,
              selectedDentistData.sentimentBreakdown.neutro,
              selectedDentistData.sentimentBreakdown.negativo,
            ],
            backgroundColor: ['#22c55e', '#f59e0b', '#94a3b8', '#ef4444'],
            borderRadius: 10,
          },
        ],
      }
    : null

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8 items-stretch">
      <div className="flex h-full flex-col rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.84)] p-6 shadow-[0_20px_44px_rgba(21,58,91,0.08)]">
        <h3 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">Distribuição de Sentimentos</h3>
        <div className="relative h-[320px] flex-1">
          <Pie data={sentimentData} options={chartOptions} />
        </div>
      </div>

      <div className="flex h-full flex-col rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.84)] p-6 shadow-[0_20px_44px_rgba(21,58,91,0.08)]">
        <h3 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">Notas da Clínica</h3>
        <p className="mb-4 text-sm leading-6 text-[var(--text-soft)]">
          Distribuição das notas gerais dadas à experiência da clínica.
        </p>
        <div className="relative h-[320px] flex-1">
          <Bar data={clinicRatingData} options={chartOptions} />
        </div>
      </div>

      <div className="flex h-full flex-col rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.84)] p-6 shadow-[0_20px_44px_rgba(21,58,91,0.08)]">
        <h3 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">Evolução das Avaliações</h3>
        <div className="relative h-[320px] flex-1">
          <Line data={evolutionData} options={chartOptions} />
        </div>
      </div>

      <div className="flex h-full flex-col rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.84)] p-6 shadow-[0_20px_44px_rgba(21,58,91,0.08)]">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[var(--color-primary)]">Aproveitamento por Dentista</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
              Índice calculado pela análise de sentimento da avaliação do dentista, ponderada pela nota atribuída.
            </p>
          </div>

          <select
            value={selectedDentist}
            onChange={(e) => setSelectedDentist(e.target.value)}
            className="w-full rounded-2xl border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.8)] px-4 py-3 text-[var(--color-text)] outline-none transition-all focus:border-[rgba(181,138,87,0.6)] focus:ring-4 focus:ring-[rgba(181,138,87,0.12)]"
          >
            {dentistPerformance.map((dentist) => (
              <option key={dentist.dentistName} value={dentist.dentistName}>
                {dentist.dentistName}
              </option>
            ))}
          </select>

          {selectedDentistData ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[rgba(21,58,91,0.05)] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Aproveitamento</p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--color-primary)]">{selectedDentistData.aproveitamento}%</p>
                </div>
                <div className="rounded-2xl bg-[rgba(181,138,87,0.12)] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Média</p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--color-primary)]">{selectedDentistData.avgRating.toFixed(1)}</p>
                </div>
                <div className="rounded-2xl bg-[rgba(34,197,94,0.08)] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Volume</p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--color-primary)]">{selectedDentistData.total}</p>
                </div>
              </div>

              <div className="relative h-[320px] flex-1">
                {dentistSentimentData && <Bar data={dentistSentimentData} options={chartOptions} />}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-[rgba(21,58,91,0.05)] p-6 text-sm text-[var(--text-soft)]">
              Ainda não há avaliações específicas por dentista para exibir.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
