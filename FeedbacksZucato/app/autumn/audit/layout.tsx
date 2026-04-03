'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/useTheme'
import { isValidAdminPath } from '@/lib/adminPath'
import { createSupabaseBrowserClient } from '@/lib/supabase-auth/browser'

export default function AutumnAuditLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const { theme } = useTheme()
	const supabase = createSupabaseBrowserClient()
	const [isLoading, setIsLoading] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)

	useEffect(() => {
		const checkAccess = async () => {
			try {
				const currentPath = window.location.pathname
				if (!isValidAdminPath(currentPath)) {
					router.replace('/404')
					return
				}

				let response = await fetch('/api/auth/check', { cache: 'no-store' })

				if (!response.ok) {
					const { data } = await supabase.auth.getSession()
					const accessToken = data.session?.access_token

					if (accessToken) {
						response = await fetch('/api/auth/check', {
							cache: 'no-store',
							headers: {
								Authorization: `Bearer ${accessToken}`,
							},
						})
					}
				}

				if (!response.ok) {
					setIsAuthenticated(false)
					router.replace('/autumn/login')
					return
				}

				setIsAuthenticated(true)
			} catch (error) {
				console.error('Erro ao verificar acesso:', error)
				setIsAuthenticated(false)
				router.replace('/autumn/login')
			} finally {
				setIsLoading(false)
			}
		}

		checkAccess()
	}, [router, supabase])

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(21,58,91,0.16),transparent_36%),linear-gradient(180deg,#f8f4ed_0%,#efe7da_100%)]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
					<p className="text-[var(--text-soft)]">Carregando ambiente administrativo...</p>
				</div>
			</div>
		)
	}

	if (!isAuthenticated) {
		return null
	}

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(21,58,91,0.12),transparent_28%),linear-gradient(180deg,#f8f4ed_0%,#f1ebe1_38%,#f7f2ea_100%)]">
			<header className="sticky top-0 z-20 border-b border-white/60 bg-[rgba(248,244,237,0.82)] backdrop-blur-xl">
				<div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
					<div className="flex items-center gap-4">
						<Image
							src={theme.logo}
							alt={theme.brand.name}
							width={52}
							height={52}
							className="rounded-2xl border border-white/60 bg-white/70 p-1 shadow-[0_10px_24px_rgba(21,58,91,0.08)]"
						/>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Ambiente Administrativo</p>
							<h1 className="text-2xl font-semibold text-[var(--color-primary)]">Dashboard {theme.brand.name.split(' ')[0]}</h1>
						</div>
					</div>
					<button
						onClick={async () => {
							try {
								await fetch('/api/auth/logout', { method: 'POST' })
								router.replace('/autumn/login')
							} catch (error) {
								console.error('Erro ao fazer logout:', error)
							}
						}}
						className="rounded-2xl border border-[rgba(21,58,91,0.12)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition-all hover:-translate-y-0.5 hover:bg-white"
					>
						Logout
					</button>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 py-8">
				{children}
			</main>
		</div>
	)
}
