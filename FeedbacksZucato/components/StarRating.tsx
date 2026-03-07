'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange: (rating: number) => void
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex justify-center gap-2 my-6">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
          aria-label={`Avaliar com ${star} estrelas`}
        >
          <span
            className={`text-5xl ${
              star <= (hovered || value) ? 'text-brand-gold' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  )
}
