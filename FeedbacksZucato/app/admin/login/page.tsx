'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast, { Toaster } from 'react-hot-toast'
import { getCurrentAdminPath } from '@/lib/adminPath'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth/browser'

type LoginStep = 'credentials' | 'mfa-enroll' | 'mfa-verify'

function toQrDataUrl(qrCode: string): string {
  const normalizedQrCode = qrCode.trim()

  if (normalizedQrCode.startsWith('data:')) {
    const separatorIndex = normalizedQrCode.indexOf(',')

    if (separatorIndex === -1) {
      return normalizedQrCode
    }

    const metadata = normalizedQrCode.slice(0, separatorIndex)
    const payload = normalizedQrCode.slice(separatorIndex + 1)

    if (metadata.includes(';base64')) {
      return `${metadata},${payload}`
    }

    try {
      return `${metadata},${encodeURIComponent(decodeURIComponent(payload))}`
    } catch {
      return `${metadata},${encodeURIComponent(payload)}`
    }
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalizedQrCode)}`
}

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [step, setStep] = useState<LoginStep>('credentials')
  const [isLoading, setIsLoading] = useState(false)
  const [adminPath, setAdminPath] = useState('')

  useEffect(() => {
    const path = getCurrentAdminPath()
    setAdminPath(path)
  }, [])

  const redirectToAdmin = () => {
    setTimeout(() => {
      router.push(adminPath || '/autumn/audit')
    }, 1200)
  }

  const assertAdminAccess = async () => {
    const response = await fetch('/api/auth/check', {
      cache: 'no-store',
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Acesso administrativo não autorizado' }))
      await supabase.auth.signOut()
      throw new Error(data.error || 'Acesso administrativo não autorizado')
    }
  }

  const beginTotpEnrollment = async (userEmail: string) => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Painel administrativo Zucato',
    })

    if (error) {
      throw error
    }

    setPendingEmail(userEmail)
    setFactorId(data.id)
    setQrCode(toQrDataUrl(data.totp.qr_code))
    setTotpSecret(data.totp.secret)
    setVerificationCode('')
    setStep('mfa-enroll')
  }

  const continueAfterPasswordLogin = async (userEmail: string) => {
    await assertAdminAccess()

    const factorsResult = await supabase.auth.mfa.listFactors()
    if (factorsResult.error) {
      throw factorsResult.error
    }

    const assuranceResult = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (assuranceResult.error) {
      throw assuranceResult.error
    }

    const totpFactor = factorsResult.data?.totp?.[0]

    if (!totpFactor) {
      await beginTotpEnrollment(userEmail)
      toast.success('Primeiro acesso: configure o autenticador para concluir o login.')
      return
    }

    if (assuranceResult.data.currentLevel !== 'aal2') {
      setPendingEmail(userEmail)
      setFactorId(totpFactor.id)
      setVerificationCode('')
      setStep('mfa-verify')
      toast.success('Digite o código do seu aplicativo autenticador.')
      return
    }

    toast.success('Login realizado com sucesso!')
    redirectToAdmin()
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        throw error
      }

      await continueAfterPasswordLogin(data.user?.email || normalizedEmail)
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const challenge = await supabase.auth.mfa.challenge({
        factorId,
      })

      if (challenge.error) {
        throw challenge.error
      }

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verificationCode.trim(),
      })

      if (verify.error) {
        throw verify.error
      }

      toast.success('Verificação concluída com sucesso!')
      redirectToAdmin()
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao verificar código')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnrollmentVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const challenge = await supabase.auth.mfa.challenge({
        factorId,
      })

      if (challenge.error) {
        throw challenge.error
      }

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verificationCode.trim(),
      })

      if (verify.error) {
        throw verify.error
      }

      toast.success('Autenticador configurado com sucesso!')
      redirectToAdmin()
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao ativar autenticador')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelFlow = async () => {
    await supabase.auth.signOut()
    setStep('credentials')
    setVerificationCode('')
    setQrCode('')
    setTotpSecret('')
    setFactorId('')
    setPendingEmail('')
  }

  return (
    <>
      <Toaster position="top-center" />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 py-8">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <Image
                src="/Logo.png"
                alt="Clínica Zucato"
                width={120}
                height={120}
                className="rounded-lg shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold text-white">Zucato</h1>
            <p className="text-blue-100 mt-2">Área Administrativa</p>
          </div>

          <div className="bg-white rounded-lg shadow-2xl p-8">
            {step === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Login do Admin</h2>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Validando...' : 'Continuar'}
                </button>
              </form>
            ) : step === 'mfa-enroll' ? (
              <form onSubmit={handleEnrollmentVerification}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Ative o Autenticador</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Escaneie o QR Code abaixo com Google Authenticator, Microsoft Authenticator, 1Password ou app equivalente para {pendingEmail}.
                </p>

                <div className="mb-4 rounded-lg border border-gray-200 p-4">
                  <Image
                    src={qrCode}
                    alt="QR Code para configurar MFA"
                    width={220}
                    height={220}
                    className="mx-auto h-auto w-full max-w-[220px]"
                    unoptimized
                  />
                </div>

                <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  Chave manual: <span className="font-semibold break-all">{totpSecret}</span>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código do aplicativo autenticador
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg tracking-[0.35em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Ativando...' : 'Ativar autenticador'}
                </button>

                <button
                  type="button"
                  onClick={handleCancelFlow}
                  disabled={isLoading}
                  className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <form onSubmit={handleMfaVerification}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Verificação em Duas Etapas</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador para {pendingEmail || email}.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código do autenticador
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg tracking-[0.35em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verificando...' : 'Entrar'}
                </button>

                <button
                  type="button"
                  onClick={handleCancelFlow}
                  disabled={isLoading}
                  className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Voltar
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-blue-100 text-sm mt-6">
            Apenas administradores podem acessar esta área
          </p>
        </div>
      </main>
    </>
  )
}
