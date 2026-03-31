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
  const cards = [
    {
      title: 'Média de Avaliações',
      value: avgRating.toFixed(1),
      note: 'de 10',
      tone: 'from-[rgba(181,138,87,0.22)] to-[rgba(181,138,87,0.06)]',
      accent: 'bg-[var(--color-secondary)]',
      valueClass: 'text-[var(--color-primary)]',
    },
    {
      title: 'Total de Avaliações',
      value: String(total),
      note: 'feedbacks coletados',
      tone: 'from-[rgba(21,58,91,0.16)] to-[rgba(21,58,91,0.05)]',
      accent: 'bg-[var(--color-primary)]',
      valueClass: 'text-[var(--color-primary)]',
    },
    {
      title: 'Feedback Positivo',
      value: `${positivoPercent}%`,
      note: 'satisfação',
      tone: 'from-[rgba(34,197,94,0.18)] to-[rgba(34,197,94,0.05)]',
      accent: 'bg-green-500',
      valueClass: 'text-green-700',
    },
    {
      title: 'Feedback Negativo',
      value: `${negativoPercent}%`,
      note: 'insatisfação',
      tone: 'from-[rgba(239,68,68,0.18)] to-[rgba(239,68,68,0.05)]',
      accent: 'bg-red-500',
      valueClass: 'text-red-700',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-[28px] border border-white/60 bg-gradient-to-br ${card.tone} p-6 shadow-[0_20px_45px_rgba(21,58,91,0.08)]`}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--text-soft)]">{card.title}</p>
            <span className={`h-3 w-3 rounded-full ${card.accent}`} />
          </div>
          <p className={`text-4xl font-semibold ${card.valueClass}`}>{card.value}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-soft)]">{card.note}</p>
        </div>
      ))}
    </div>
  )
}
