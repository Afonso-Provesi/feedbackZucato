'use client'

import { useState } from 'react'
import { getSentimentLabel, getSentimentColor } from '@/lib/sentiment'

type FeedbackSentiment = 'positivo' | 'negativo' | 'neutro' | 'misto'

interface Feedback {
  id: string
  rating: number
  comment: string | null
  dentist_name: string | null
  dentist_rating: number | null
  dentist_comment: string | null
  dentist_sentiment: FeedbackSentiment | null
  sentiment: FeedbackSentiment | null
  created_at: string
  is_anonymous: boolean
}

interface FeedbackTableProps {
  feedbacks: Feedback[]
  onFilter: (sentiment: string) => void
}

export default function FeedbackTable({ feedbacks, onFilter }: FeedbackTableProps) {
  const [activeFilter, setActiveFilter] = useState('todos')

  const handleFilter = (sentiment: string) => {
    setActiveFilter(sentiment)
    onFilter(sentiment)
  }

  return (
    <div className="rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.84)] p-6 shadow-[0_20px_44px_rgba(21,58,91,0.08)]">
      <h3 className="text-2xl font-semibold text-[var(--color-primary)] mb-4">Feedbacks Recentes</h3>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['todos', 'positivo', 'misto', 'negativo', 'neutro'].map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilter(filter)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
              activeFilter === filter
                ? 'bg-[var(--color-primary)] text-white shadow-[0_12px_24px_rgba(21,58,91,0.18)]'
                : 'bg-[rgba(21,58,91,0.06)] text-[var(--text-soft)] hover:bg-[rgba(21,58,91,0.12)]'
            }`}
          >
            {filter === 'neutro' ? 'Mediano' : filter === 'misto' ? 'Misto' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[22px] border border-[rgba(21,58,91,0.08)]">
        <table className="min-w-[1220px] w-full table-fixed text-sm">
          <thead className="border-b border-[rgba(21,58,91,0.08)] bg-[rgba(21,58,91,0.04)]">
            <tr>
              <th className="w-[100px] text-left p-3 text-[var(--text-soft)] font-semibold">Data</th>
              <th className="w-[88px] text-left p-3 text-[var(--text-soft)] font-semibold">Avaliação</th>
              <th className="w-[140px] text-left p-3 text-[var(--text-soft)] font-semibold">Dentista</th>
              <th className="w-[88px] text-left p-3 text-[var(--text-soft)] font-semibold">Nota do dentista</th>
              <th className="w-[120px] text-left p-3 text-[var(--text-soft)] font-semibold">Sent. clínica</th>
              <th className="w-[120px] text-left p-3 text-[var(--text-soft)] font-semibold">Sent. dentista</th>
              <th className="w-[320px] text-left p-3 text-[var(--text-soft)] font-semibold">Comentário</th>
              <th className="w-[320px] text-left p-3 text-[var(--text-soft)] font-semibold">Comentário do dentista</th>
              <th className="w-[120px] text-left p-3 text-[var(--text-soft)] font-semibold">Privacidade</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center p-6 text-[var(--text-soft)]">
                  Nenhum feedback encontrado
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback) => (
                <tr key={feedback.id} className="border-b border-[rgba(21,58,91,0.06)] hover:bg-[rgba(21,58,91,0.03)]">
                  <td className="p-3 text-[var(--color-text)]">
                    {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3">
                    <div className="inline-block bg-[var(--color-primary)] text-white px-3 py-1 rounded-xl font-semibold">
                      {feedback.rating}/10
                    </div>
                  </td>
                  <td className="p-3 text-[var(--color-text)]">
                    {feedback.dentist_name || '-'}
                  </td>
                  <td className="p-3">
                    {feedback.dentist_rating ? (
                      <div className="inline-block bg-[var(--color-secondary)] text-white px-3 py-1 rounded-xl font-semibold">
                        {feedback.dentist_rating}/10
                      </div>
                    ) : (
                      <span className="text-[var(--text-soft)] text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {feedback.sentiment ? (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: getSentimentColor(feedback.sentiment) }}
                      >
                        {getSentimentLabel(feedback.sentiment)}
                      </span>
                    ) : (
                      <span className="text-[var(--text-soft)] text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {feedback.dentist_sentiment ? (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: getSentimentColor(feedback.dentist_sentiment) }}
                      >
                        {getSentimentLabel(feedback.dentist_sentiment)}
                      </span>
                    ) : (
                      <span className="text-[var(--text-soft)] text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3 text-[var(--text-soft)] align-top">
                    {feedback.comment || '-'}
                  </td>
                  <td className="p-3 text-[var(--text-soft)] align-top">
                    {feedback.dentist_comment || '-'}
                  </td>
                  <td className="p-3 text-[var(--color-text)]">
                    <span className="text-[var(--text-soft)] text-sm">Anônimo</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {feedbacks.length > 0 && (
        <div className="text-center text-sm text-[var(--text-soft)] mt-4">
          Mostrando {feedbacks.length} feedbacks
        </div>
      )}
    </div>
  )
}
