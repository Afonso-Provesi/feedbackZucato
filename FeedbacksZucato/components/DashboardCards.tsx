'use client'

interface DashboardCardsProps {
  avgRating: number
  total: number
  positivoPercent: string
  negativoPercent: string
}

export default function DashboardCards({
  avgRating,
  total,
  positivoPercent,
  negativoPercent,
}: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Média de Avaliações */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-brand-gold">
        <p className="text-gray-600 text-sm font-semibold mb-2">Média de Avaliações</p>
        <p className="text-3xl font-bold text-brand-blue">{avgRating.toFixed(1)}</p>
        <p className="text-gray-400 text-xs mt-2">de 5 estrelas</p>
      </div>

      {/* Total de Avaliações */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-brand-blue">
        <p className="text-gray-600 text-sm font-semibold mb-2">Total de Avaliações</p>
        <p className="text-3xl font-bold text-brand-blue">{total}</p>
        <p className="text-gray-400 text-xs mt-2">feedbacks coletados</p>
      </div>

      {/* % Positivo */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
        <p className="text-gray-600 text-sm font-semibold mb-2">Feedback Positivo</p>
        <p className="text-3xl font-bold text-green-600">{positivoPercent}%</p>
        <p className="text-gray-400 text-xs mt-2">satisfação</p>
      </div>

      {/* % Negativo */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
        <p className="text-gray-600 text-sm font-semibold mb-2">Feedback Negativo</p>
        <p className="text-3xl font-bold text-red-600">{negativoPercent}%</p>
        <p className="text-gray-400 text-xs mt-2">insatisfação</p>
      </div>
    </div>
  )
}
