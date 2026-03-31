'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange: (rating: number) => void
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="my-8">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
        <span>Menor satisfação</span>
        <span>Maior satisfação</span>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            onMouseEnter={() => setHovered(num)}
            onMouseLeave={() => setHovered(0)}
            className={`flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
              num <= (hovered || value)
                ? 'border-[rgba(181,138,87,0.55)] bg-[linear-gradient(135deg,rgba(181,138,87,0.22),rgba(21,58,91,0.12))] text-[var(--color-primary)] shadow-[0_10px_22px_rgba(21,58,91,0.12)]'
                : 'border-[rgba(21,58,91,0.1)] bg-white/70 text-[var(--text-soft)] hover:border-[rgba(181,138,87,0.45)] hover:bg-[rgba(255,250,243,0.92)]'
            }`}
            aria-label={`Avaliar com ${num}`}
            aria-pressed={num === value}
          >
            {num}
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-[var(--text-soft)]">
        {value === 0 ? 'Selecione uma nota de 1 a 10' : `Sua avaliação: ${value}`}
      </p>
    </div>
  )
}
