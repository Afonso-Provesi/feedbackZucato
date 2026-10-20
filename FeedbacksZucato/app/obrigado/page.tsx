'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Tempo (em segundos) até voltar sozinho para o formulário, deixando o
// tablet pronto para o próximo paciente.
const AUTO_RETURN_SECONDS = 8

export default function ThankYouPage() {
  const router = useRouter()
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.replace('/')
      return
    }

    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-brand-white py-8">
      <div className="container-feedback w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Ícone de sucesso */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <span className="text-4xl">✓</span>
          </div>

          {/* Mensagem de agradecimento */}
          <h1 className="text-3xl font-bold text-brand-blue mb-4">
            Agradecemos muito seu feedback!
          </h1>

          <p className="text-gray-600 mb-8">
            Sua opinião é muito importante para melhorarmos cada vez mais nossos serviços.
          </p>

          <Link
            href="/"
            className="inline-block bg-brand-blue text-white py-3 px-8 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
          >
            Voltar
          </Link>

          <p className="text-sm text-gray-500 mt-4">
            Voltando para o início em {Math.max(secondsLeft, 0)}s...
          </p>
        </div>
      </div>
    </main>
  )
}
