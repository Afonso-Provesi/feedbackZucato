'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StarRating from './StarRating'
import toast, { Toaster } from 'react-hot-toast'
import { DENTISTS } from '@/lib/dentists'
import { validateTextField, normalizeTextFieldForEditing } from '@/lib/inputProtection'

export default function FeedbackForm() {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [dentistName, setDentistName] = useState('')
  const [dentistRating, setDentistRating] = useState(0)
  const [dentistComment, setDentistComment] = useState('')
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

    if (!dentistName) {
      toast.error('Por favor, selecione o dentista responsável pelo atendimento')
      return
    }

    if (dentistRating === 0) {
      toast.error('Por favor, selecione uma nota para o dentista')
      return
    }

    if (dentistRating < 1 || dentistRating > 10) {
      toast.error('A nota do dentista deve estar entre 1 e 10')
      return
    }

    const clinicCommentValidation = validateTextField(comment, {
      fieldLabel: 'comentario sobre a clinica',
      maxLength: 500,
      preserveNewlines: true,
    })
    if (!clinicCommentValidation.ok) {
      toast.error(clinicCommentValidation.error || 'Conteudo invalido no comentario da clinica')
      return
    }

    const dentistCommentValidation = validateTextField(dentistComment, {
      fieldLabel: 'comentario sobre o dentista',
      maxLength: 500,
      preserveNewlines: true,
    })
    if (!dentistCommentValidation.ok) {
      toast.error(dentistCommentValidation.error || 'Conteudo invalido no comentario sobre o dentista')
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
          comment: clinicCommentValidation.sanitizedValue || null,
          dentistName,
          dentistRating,
          dentistComment: dentistCommentValidation.sanitizedValue || null,
          isAnonymous: true,
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
          console.error('Erro ao fazer parse da resposta:', parseError)
        }

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
        <div className="rounded-[28px] border border-[rgba(181,138,87,0.18)] bg-white/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)]">
            Etapa 1
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
            Escolha a nota que melhor representa como você se sentiu durante o atendimento.
          </p>

          <StarRating value={rating} onChange={setRating} />

          <label className="mt-5 block text-sm font-semibold text-[var(--color-primary)]">
            Comentário sobre a clínica
          </label>
          <textarea
            value={comment}
            onChange={(e) =>
              setComment(
                normalizeTextFieldForEditing(e.target.value, {
                  maxLength: 500,
                  preserveNewlines: true,
                })
              )
            }
            placeholder="Conte como foi seu atendimento, ambiente, recepção ou tratamento."
            className="mt-2 w-full resize-none rounded-[22px] border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.78)] p-4 text-[var(--color-text)] outline-none transition-all placeholder:text-[rgba(32,48,64,0.44)] focus:border-[rgba(181,138,87,0.6)] focus:bg-white focus:ring-4 focus:ring-[rgba(181,138,87,0.12)]"
            rows={4}
            maxLength={500}
          />
          <p className="mt-2 text-right text-xs text-[var(--text-soft)]">{comment.length}/500</p>
        </div>

        <div className="mt-5 rounded-[28px] border border-[rgba(181,138,87,0.18)] bg-white/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)]">
            Etapa 2
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
            Selecione o dentista e registre uma nota específica para o atendimento recebido.
          </p>

          <label className="mt-5 block text-sm font-semibold text-[var(--color-primary)]">
            Dentista responsável
          </label>
          <select
            value={dentistName}
            onChange={(e) => setDentistName(e.target.value)}
            className="mt-2 w-full rounded-[22px] border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.78)] p-4 text-[var(--color-text)] outline-none transition-all focus:border-[rgba(181,138,87,0.6)] focus:bg-white focus:ring-4 focus:ring-[rgba(181,138,87,0.12)]"
            required
          >
            <option value="">Selecione um dentista</option>
            {DENTISTS.map((dentist) => (
              <option key={dentist} value={dentist}>
                {dentist}
              </option>
            ))}
          </select>

          <div className="mt-5 rounded-[22px] border border-[rgba(21,58,91,0.08)] bg-[rgba(255,250,243,0.55)] p-4">
            <p className="text-sm font-semibold text-[var(--color-primary)]">Nota para o dentista</p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
              Avalie especificamente a condução do atendimento pelo profissional.
            </p>
            <StarRating value={dentistRating} onChange={setDentistRating} />
          </div>

          <label className="mt-5 block text-sm font-semibold text-[var(--color-primary)]">
            Comentário sobre o dentista
          </label>
          <textarea
            value={dentistComment}
            onChange={(e) =>
              setDentistComment(
                normalizeTextFieldForEditing(e.target.value, {
                  maxLength: 500,
                  preserveNewlines: true,
                })
              )
            }
            placeholder="Se desejar, conte como foi a atenção, clareza e cuidado do dentista."
            className="mt-2 w-full resize-none rounded-[22px] border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.78)] p-4 text-[var(--color-text)] outline-none transition-all placeholder:text-[rgba(32,48,64,0.44)] focus:border-[rgba(181,138,87,0.6)] focus:bg-white focus:ring-4 focus:ring-[rgba(181,138,87,0.12)]"
            rows={4}
            maxLength={500}
          />
          <p className="mt-2 text-right text-xs text-[var(--text-soft)]">{dentistComment.length}/500</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-[22px] bg-[linear-gradient(135deg,var(--color-primary),#245783)] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_36px_rgba(21,58,91,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(21,58,91,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Enviando...' : 'Enviar avaliação'}
        </button>

        <p className="mt-4 text-center text-xs leading-6 text-[var(--text-soft)]">
          Sua avaliação é registrada de forma anônima para incentivar respostas sinceras, tanto positivas quanto negativas.
        </p>
      </form>
    </>
  )
}
