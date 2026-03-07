'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StarRating from './StarRating'
import toast, { Toaster } from 'react-hot-toast'

export default function FeedbackForm() {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [patientName, setPatientName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Por favor, selecione uma avaliação de 1 a 10')
      return
    }

    if (rating < 1 || rating > 10) {
      toast.error('Avaliação deve estar entre 1 e 10')
      return
    }

    if (!patientName.trim()) {
      toast.error('Por favor, informe seu nome')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment || null,
          isAnonymous: false,
          patientName: patientName.trim(),
          source: 'whatsapp',
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Erro ao enviar feedback'
        let errorDetails = ''

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          errorDetails = errorData.details || ''
        } catch (parseError) {
          // Se não conseguir fazer parse do JSON, usar mensagem genérica
          console.error('Erro ao fazer parse da resposta:', parseError)
        }

        // Mostrar mensagem detalhada se disponível
        if (errorDetails) {
          toast.error(`${errorMessage}\n\n${errorDetails}`)
        } else {
          toast.error(errorMessage)
        }

        return
      }

      toast.success('Feedback enviado com sucesso!')
      setTimeout(() => {
        router.push('/obrigado')
      }, 1500)
    } catch (error) {
      console.error('Erro de rede:', error)
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Toaster position="top-center" />
      <form onSubmit={handleSubmit} className="w-full">
        <StarRating value={rating} onChange={setRating} />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Quer nos contar um pouco mais sobre sua experiência?"
          className="w-full p-4 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
          rows={4}
          maxLength={500}
        />

        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="Seu nome"
          className="w-full p-4 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          maxLength={100}
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-blue text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      </form>
    </>
  )
}
