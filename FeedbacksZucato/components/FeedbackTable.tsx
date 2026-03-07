'use client'

import { useState } from 'react'
import { getSentimentLabel, getSentimentColor } from '@/lib/sentiment'

interface Feedback {
  id: string
  rating: number
  comment: string | null
  sentiment: 'positivo' | 'negativo' | 'neutro' | null
  created_at: string
  patient_name: string | null
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Feedbacks Recentes</h3>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['todos', 'positivo', 'negativo', 'neutro'].map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeFilter === filter
                ? 'bg-brand-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-gray-200">
            <tr>
              <th className="text-left p-3 text-gray-600 font-semibold">Data</th>
              <th className="text-left p-3 text-gray-600 font-semibold">Avaliação</th>
              <th className="text-left p-3 text-gray-600 font-semibold">Sentimento</th>
              <th className="text-left p-3 text-gray-600 font-semibold">Comentário</th>
              <th className="text-left p-3 text-gray-600 font-semibold">Paciente</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-6 text-gray-500">
                  Nenhum feedback encontrado
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback) => (
                <tr key={feedback.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-700">
                    {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < feedback.rating ? 'text-brand-gold' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    {feedback.sentiment ? (
                      <span
                        className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                        style={{ backgroundColor: getSentimentColor(feedback.sentiment) }}
                      >
                        {getSentimentLabel(feedback.sentiment)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-600 max-w-xs truncate">
                    {feedback.comment || '-'}
                  </td>
                  <td className="p-3 text-gray-700">
                    {feedback.is_anonymous ? (
                      <span className="text-gray-400 text-sm">Anônimo</span>
                    ) : (
                      feedback.patient_name || '-'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {feedbacks.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Mostrando {feedbacks.length} feedbacks
        </div>
      )}
    </div>
  )
}
