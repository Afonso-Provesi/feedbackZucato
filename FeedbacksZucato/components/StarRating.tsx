'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange: (rating: number) => void
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex flex-col items-center my-6">
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            onMouseEnter={() => setHovered(num)}
            onMouseLeave={() => setHovered(0)}
            className="transition-all hover:scale-110 w-10 h-10 flex items-center justify-center rounded-md"
            aria-label={`Avaliar com ${num}`}
          >
            <span
              className={`text-xl font-bold ${
                num <= (hovered || value)
                  ? 'text-brand-blue bg-blue-100 rounded-md w-full h-full flex items-center justify-center'
                  : 'text-gray-400'
              }`}
            >
              {num}
            </span>
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600">
        {value === 0 ? 'Selecione uma nota de 1 a 10' : `Sua avaliação: ${value}`}
      </p>
    </div>
  )
}
