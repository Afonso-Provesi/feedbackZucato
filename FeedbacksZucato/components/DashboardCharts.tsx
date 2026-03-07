'use client'

import { useState, useEffect } from 'react'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Pie, Line } from 'react-chartjs-2'

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface DashboardChartsProps {
  sentimentBreakdown: {
    positivo: number
    negativo: number
    neutro: number
  }
  evolution: Array<{
    date: string
    media: string
  }>
}

export default function DashboardCharts({ sentimentBreakdown, evolution }: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Carregando gráficos...</div>
  }

  const sentimentData = {
    labels: ['Positivo', 'Negativo', 'Neutro'],
    datasets: [
      {
        data: [sentimentBreakdown.positivo, sentimentBreakdown.negativo, sentimentBreakdown.neutro],
        backgroundColor: ['#22c55e', '#ef4444', '#94a3b8'],
        borderColor: ['#16a34a', '#dc2626', '#64748b'],
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Gráfico de Pizza - Sentimentos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição de Sentimentos</h3>
        <div className="relative h-64">
          <Pie data={sentimentData} options={chartOptions} />
        </div>
      </div>

      {/* Gráfico de Linha - Evolução */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolução das Avaliações</h3>
        <div className="relative h-64">
          <Line data={evolutionData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}
