'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast, { Toaster } from 'react-hot-toast'
import { getCurrentAdminPath } from '@/lib/adminPath'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth/browser'
import { normalizeEmailInput } from '@/lib/inputProtection'

type LoginStep = 'credentials' | 'mfa-enroll' | 'mfa-verify' | 'recovery' | 'recovery-request'

function hasRecoveryMarkers(): boolean {
	if (typeof window === 'undefined') {
		return false
	}

	const search = window.location.search
	const hash = window.location.hash

	return (
		search.includes('mode=recovery') ||
		search.includes('type=recovery') ||
		search.includes('code=') ||
		hash.includes('type=recovery') ||
		hash.includes('access_token=') ||
		hash.includes('refresh_token=')
	)
}

function clearRecoveryUrl(): void {
	if (typeof window === 'undefined') {
		return
	}

	const url = new URL(window.location.href)
	url.searchParams.delete('code')
	url.searchParams.delete('mode')
	url.searchParams.delete('type')
	window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`)
}

function getHashParams(): URLSearchParams {
	if (typeof window === 'undefined') {
		return new URLSearchParams()
	}

	const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
	return new URLSearchParams(hash)
}

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

async function reportAdminSecurityEvent(params: {
	eventType: 'failed-login' | 'failed-mfa'
	attemptedEmail?: string
	reason: string
	requestPath: string
}) {
	try {
		await fetch('/api/security/admin-access-alert', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		})
	} catch (error) {
		console.error('Erro ao reportar evento de segurança:', error)
	}
}

export default function AutumnLoginPage() {
	const router = useRouter()
	const supabase = createSupabaseBrowserClient()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [verificationCode, setVerificationCode] = useState('')
	const [qrCode, setQrCode] = useState('')
	const [totpSecret, setTotpSecret] = useState('')
	const [factorId, setFactorId] = useState('')
	const [pendingEmail, setPendingEmail] = useState('')
	const [step, setStep] = useState<LoginStep>('credentials')
	const [isLoading, setIsLoading] = useState(false)
	const [adminPath, setAdminPath] = useState('')
	const [isPreparingRecovery, setIsPreparingRecovery] = useState(false)

	useEffect(() => {
		const path = getCurrentAdminPath()
		setAdminPath(path)

		const recoverSession = async () => {
			if (!hasRecoveryMarkers()) {
				return
			}

			setIsPreparingRecovery(true)

			try {
				const url = new URL(window.location.href)
				const code = url.searchParams.get('code')
				const hashParams = getHashParams()
				const accessToken = hashParams.get('access_token')
				const refreshToken = hashParams.get('refresh_token')

				if (code) {
					const { error } = await supabase.auth.exchangeCodeForSession(code)
					if (error) {
						throw error
					}
				} else if (accessToken && refreshToken) {
					const { error } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					})

					if (error) {
						throw error
					}
				}

				const { data, error } = await supabase.auth.getUser()
				if (error || !data.user?.email) {
					throw error || new Error('Não foi possível validar a recuperação de senha')
				}

				setPendingEmail(data.user.email)
				setNewPassword('')
				setConfirmPassword('')
				setStep('recovery')
			} finally {
				setIsPreparingRecovery(false)
			}
		}

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'PASSWORD_RECOVERY') {
				setPendingEmail(session?.user?.email || '')
				setNewPassword('')
				setConfirmPassword('')
				setVerificationCode('')
				setStep('recovery')
			}
		})

		recoverSession().catch((error) => {
			console.error('Erro ao preparar fluxo de recuperação:', error)
			toast.error(error instanceof Error ? error.message : 'Erro ao preparar redefinição de senha')
		})

		return () => {
			subscription.unsubscribe()
		}
	}, [supabase.auth])

	const redirectToAdmin = () => {
		setTimeout(() => {
			router.push(adminPath || '/autumn/audit')
		}, 1200)
	}

	const assertAdminAccess = async (accessToken?: string) => {
		const headers: HeadersInit = {}

		if (accessToken) {
			headers.Authorization = `Bearer ${accessToken}`
		}

		const response = await fetch('/api/auth/check', {
			cache: 'no-store',
			headers,
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

	const continueAfterPasswordLogin = async (userEmail: string, accessToken?: string) => {
		await assertAdminAccess(accessToken)

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
			const normalizedEmail = normalizeEmailInput(email)
			const { data, error } = await supabase.auth.signInWithPassword({
				email: normalizedEmail,
				password,
			})

			if (error) {
				throw error
			}

			await continueAfterPasswordLogin(data.user?.email || normalizedEmail, data.session?.access_token)
		} catch (error) {
			await reportAdminSecurityEvent({
				eventType: 'failed-login',
				attemptedEmail: normalizeEmailInput(email),
				reason: error instanceof Error ? error.message : 'Falha de autenticação administrativa',
				requestPath: '/autumn/login',
			})

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
			await reportAdminSecurityEvent({
				eventType: 'failed-mfa',
				attemptedEmail: pendingEmail,
				reason: error instanceof Error ? error.message : 'Falha na verificacao MFA',
				requestPath: '/autumn/login',
			})

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
			await reportAdminSecurityEvent({
				eventType: 'failed-mfa',
				attemptedEmail: pendingEmail,
				reason: error instanceof Error ? error.message : 'Falha ao ativar MFA',
				requestPath: '/autumn/login',
			})

			console.error('Erro:', error)
			toast.error(error instanceof Error ? error.message : 'Erro ao ativar autenticador')
		} finally {
			setIsLoading(false)
		}
	}

	const handleCancelFlow = async () => {
		await supabase.auth.signOut()
		setStep('credentials')
		setPassword('')
		setVerificationCode('')
		setQrCode('')
		setTotpSecret('')
		setFactorId('')
		setPendingEmail('')
		setNewPassword('')
		setConfirmPassword('')
		clearRecoveryUrl()
	}

	const handlePasswordRecovery = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			if (newPassword.length < 8) {
				throw new Error('A nova senha deve ter no mínimo 8 caracteres')
			}

			if (newPassword !== confirmPassword) {
				throw new Error('As senhas não coincidem')
			}

			const { data: currentUserData, error: currentUserError } = await supabase.auth.getUser()
			if (currentUserError || !currentUserData.user?.email) {
				throw currentUserError || new Error('Sessão de recuperação inválida ou expirada')
			}

			if (pendingEmail && currentUserData.user.email.toLowerCase() !== pendingEmail.toLowerCase()) {
				throw new Error('A sessão de recuperação não corresponde ao email esperado')
			}

			const { error } = await supabase.auth.updateUser({
				password: newPassword,
			})

			if (error) {
				throw error
			}

			await supabase.auth.signOut()
			clearRecoveryUrl()
			setStep('credentials')
			setPendingEmail('')
			setNewPassword('')
			setConfirmPassword('')
			toast.success('Senha redefinida com sucesso. Entre com a nova senha.')
		} catch (error) {
			console.error('Erro:', error)
			toast.error(error instanceof Error ? error.message : 'Erro ao redefinir senha')
		} finally {
			setIsLoading(false)
		}
	}

	const handleRecoveryRequest = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			const normalizedEmail = normalizeEmailInput(email)

			if (!normalizedEmail) {
				throw new Error('Informe o email da conta para continuar')
			}

			const response = await fetch('/api/auth/password-recovery', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: normalizedEmail }),
			})

			const data = await response.json().catch(() => null)

			if (!response.ok) {
				throw new Error(data?.error || 'Erro ao solicitar recuperação de senha')
			}

			toast.success(data?.message || 'Se o email existir, enviaremos um link de recuperação.')
			setPassword('')
			setStep('credentials')
		} catch (error) {
			console.error('Erro:', error)
			toast.error(error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<>
			<Toaster position="top-center" />
			<main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(21,58,91,0.24),transparent_30%),linear-gradient(180deg,#183b5a_0%,#102d45_100%)] py-8">
				<div className="w-full max-w-md px-4">
					<div className="text-center mb-8">
						<div className="inline-block mb-4 rounded-[28px] border border-white/15 bg-white/10 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-md">
							<Image
								src="/Logo.png"
								alt="Clínica Zucato"
								width={120}
								height={120}
								className="rounded-2xl"
							/>
						</div>
						<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,250,243,0.74)]">Área Corporativa</p>
						<h1 className="mt-2 text-4xl font-semibold text-white">Zucato</h1>
						<p className="text-[rgba(255,250,243,0.78)] mt-2">Acesso administrativo com autenticação reforçada</p>
					</div>

					<div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,246,240,0.92))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl">
						{isPreparingRecovery && (
							<div className="mb-6 rounded-2xl border border-[rgba(21,58,91,0.1)] bg-[rgba(21,58,91,0.04)] px-4 py-3 text-sm text-[var(--text-soft)]">
								Validando link de redefinição de senha...
							</div>
						)}
						{step === 'credentials' ? (
							<form onSubmit={handleCredentialsSubmit}>
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)] mb-2">Entrar</p>
								<h2 className="text-3xl font-semibold text-[var(--color-primary)] mb-6">Login do Admin</h2>

								<div className="mb-4">
									<label className="block text-sm font-semibold text-[var(--color-primary)] mb-2">
										Email
									</label>
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(normalizeEmailInput(e.target.value))}
										placeholder="seu@email.com"
										className="w-full rounded-2xl border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.8)] px-4 py-3 focus:outline-none focus:ring-4 focus:ring-[rgba(181,138,87,0.12)] focus:border-[rgba(181,138,87,0.5)]"
										required
									/>
								</div>

								<div className="mb-6">
									<label className="block text-sm font-semibold text-[var(--color-primary)] mb-2">
										Senha
									</label>
									<input
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="Sua senha"
										className="w-full rounded-2xl border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.8)] px-4 py-3 focus:outline-none focus:ring-4 focus:ring-[rgba(181,138,87,0.12)] focus:border-[rgba(181,138,87,0.5)]"
										required
									/>
								</div>

								<button
									type="submit"
									disabled={isLoading}
									className="w-full rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),#245783)] py-3 text-white font-semibold shadow-[0_18px_34px_rgba(21,58,91,0.22)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? 'Validando...' : 'Continuar'}
								</button>

								<button
									type="button"
									onClick={() => setStep('recovery-request')}
									disabled={isLoading}
									className="mt-4 w-full text-sm text-[var(--text-soft)] hover:text-[var(--color-primary)] disabled:opacity-50"
								>
									Esqueci minha senha
								</button>
							</form>
						) : step === 'recovery-request' ? (
							<form onSubmit={handleRecoveryRequest}>
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)] mb-2">Recuperação</p>
								<h2 className="text-3xl font-semibold text-[var(--color-primary)] mb-2">Receber Link por Email</h2>
								<p className="text-sm text-[var(--text-soft)] mb-6">
									Informe o email da conta administrativa. Se a conta existir e estiver ativa, enviaremos um link de redefinição.
								</p>

								<div className="mb-6">
									<label className="block text-sm font-semibold text-[var(--color-primary)] mb-2">
										Email
									</label>
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(normalizeEmailInput(e.target.value))}
										placeholder="seu@email.com"
										className="w-full rounded-2xl border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.8)] px-4 py-3 focus:outline-none focus:ring-4 focus:ring-[rgba(181,138,87,0.12)] focus:border-[rgba(181,138,87,0.5)]"
										required
									/>
								</div>

								<button
									type="submit"
									disabled={isLoading}
									className="w-full rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),#245783)] py-3 text-white font-semibold shadow-[0_18px_34px_rgba(21,58,91,0.22)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
								</button>

								<button
									type="button"
									onClick={() => setStep('credentials')}
									disabled={isLoading}
									className="mt-4 w-full text-sm text-[var(--text-soft)] hover:text-[var(--color-primary)] disabled:opacity-50"
								>
									Voltar ao login
								</button>
							</form>
						) : step === 'recovery' ? (
							<form onSubmit={handlePasswordRecovery}>
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)] mb-2">Recuperação</p>
								<h2 className="text-3xl font-semibold text-[var(--color-primary)] mb-2">Definir Nova Senha</h2>
								<p className="text-sm text-[var(--text-soft)] mb-6">
									Defina a nova senha da conta administrativa {pendingEmail ? `para ${pendingEmail}` : 'e finalize o acesso'}.
								</p>

								<div className="mb-4">
									<label className="block text-sm font-semibold text-[var(--color-primary)] mb-2">
										Nova senha
									</label>
									<input
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										placeholder="Mínimo de 8 caracteres"
										className="w-full rounded-2xl border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.8)] px-4 py-3 focus:outline-none focus:ring-4 focus:ring-[rgba(181,138,87,0.12)] focus:border-[rgba(181,138,87,0.5)]"
										required
									/>
								</div>

								<div className="mb-6">
									<label className="block text-sm font-semibold text-[var(--color-primary)] mb-2">
										Confirmar nova senha
									</label>
									<input
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="Repita a nova senha"
										className="w-full rounded-2xl border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.8)] px-4 py-3 focus:outline-none focus:ring-4 focus:ring-[rgba(181,138,87,0.12)] focus:border-[rgba(181,138,87,0.5)]"
										required
									/>
								</div>

								<button
									type="submit"
									disabled={isLoading}
									className="w-full rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),#245783)] py-3 text-white font-semibold shadow-[0_18px_34px_rgba(21,58,91,0.22)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? 'Salvando...' : 'Salvar nova senha'}
								</button>

								<button
									type="button"
									onClick={handleCancelFlow}
									disabled={isLoading}
									className="mt-4 w-full text-sm text-[var(--text-soft)] hover:text-[var(--color-primary)] disabled:opacity-50"
								>
									Cancelar
								</button>
							</form>
						) : step === 'mfa-enroll' ? (
							<form onSubmit={handleEnrollmentVerification}>
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)] mb-2">Primeiro acesso</p>
								<h2 className="text-3xl font-semibold text-[var(--color-primary)] mb-2">Ative o Autenticador</h2>
								<p className="text-sm text-[var(--text-soft)] mb-6">
									Escaneie o QR Code abaixo com Google Authenticator, Microsoft Authenticator, 1Password ou app equivalente para {pendingEmail}.
								</p>

								<div className="mb-4 rounded-[24px] border border-[rgba(21,58,91,0.1)] bg-white p-4">
									<Image
										src={qrCode}
										alt="QR Code para configurar MFA"
										width={220}
										height={220}
										className="mx-auto h-auto w-full max-w-[220px]"
										unoptimized
									/>
								</div>

								<div className="mb-4 rounded-[20px] bg-[rgba(21,58,91,0.05)] px-4 py-3 text-sm text-[var(--color-primary)]">
									Chave manual: <span className="font-semibold break-all">{totpSecret}</span>
								</div>

								<div className="mb-6">
									<label className="block text-sm font-semibold text-[var(--color-primary)] mb-2">
										Código do aplicativo autenticador
									</label>
									<input
										type="text"
										inputMode="numeric"
										value={verificationCode}
										onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
										placeholder="000000"
										className="w-full rounded-2xl border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.8)] px-4 py-3 tracking-[0.35em] text-center text-lg focus:outline-none focus:ring-4 focus:ring-[rgba(181,138,87,0.12)] focus:border-[rgba(181,138,87,0.5)]"
										required
									/>
								</div>

								<button
									type="submit"
									disabled={isLoading || verificationCode.length !== 6}
									className="w-full rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),#245783)] py-3 text-white font-semibold shadow-[0_18px_34px_rgba(21,58,91,0.22)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? 'Ativando...' : 'Ativar autenticador'}
								</button>

								<button
									type="button"
									onClick={handleCancelFlow}
									disabled={isLoading}
									className="mt-4 w-full text-sm text-[var(--text-soft)] hover:text-[var(--color-primary)] disabled:opacity-50"
								>
									Cancelar
								</button>
							</form>
						) : (
							<form onSubmit={handleMfaVerification}>
								<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)] mb-2">Segurança</p>
								<h2 className="text-3xl font-semibold text-[var(--color-primary)] mb-2">Verificação em Duas Etapas</h2>
								<p className="text-sm text-[var(--text-soft)] mb-6">
									Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador para {pendingEmail || email}.
								</p>

								<div className="mb-4">
									<label className="block text-sm font-semibold text-[var(--color-primary)] mb-2">
										Código do autenticador
									</label>
									<input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										value={verificationCode}
										onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
										placeholder="000000"
										className="w-full rounded-2xl border border-[rgba(21,58,91,0.12)] bg-[rgba(255,250,243,0.8)] px-4 py-3 tracking-[0.35em] text-center text-lg focus:outline-none focus:ring-4 focus:ring-[rgba(181,138,87,0.12)] focus:border-[rgba(181,138,87,0.5)]"
										required
									/>
								</div>

								<button
									type="submit"
									disabled={isLoading || verificationCode.length !== 6}
									className="w-full rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),#245783)] py-3 text-white font-semibold shadow-[0_18px_34px_rgba(21,58,91,0.22)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isLoading ? 'Verificando...' : 'Entrar'}
								</button>

								<button
									type="button"
									onClick={handleCancelFlow}
									disabled={isLoading}
									className="mt-4 w-full text-sm text-[var(--text-soft)] hover:text-[var(--color-primary)] disabled:opacity-50"
								>
									Voltar
								</button>
							</form>
						)}
					</div>

					<p className="text-center text-[rgba(255,250,243,0.74)] text-sm mt-6">
						Apenas administradores podem acessar esta área
					</p>
				</div>
			</main>
		</>
	)
}
