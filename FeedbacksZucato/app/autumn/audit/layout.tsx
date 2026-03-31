'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/useTheme'
import { isValidAdminPath } from '@/lib/adminPath'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const { theme } = useTheme()
	const [isLoading, setIsLoading] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [isValidPath, setIsValidPath] = useState(false)

	useEffect(() => {
		const checkAccess = async () => {
			try {
				const currentPath = window.location.pathname
				if (!isValidAdminPath(currentPath)) {
					router.push('/404')
					return
				}
				setIsValidPath(true)
				const response = await fetch('/api/auth/check')
				if (response.ok) {
					setIsAuthenticated(true)
				} else {
					setIsAuthenticated(false)
				}
			} catch (error) {
				setIsAuthenticated(false)
			} finally {
				setIsLoading(false)
			}
		}
		checkAccess()
	}, [router])

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Carregando...</p>
				</div>
			</div>
		)
	}

	return (
		<>
			{isAuthenticated ? (
				<div className="min-h-screen bg-gray-50">
					<header className="bg-white shadow-sm border-b border-[var(--color-border)]">
						<div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
							<div className="flex items-center gap-3">
								<Image
									src={theme.logo}
									alt={theme.brand.name}
									width={50}
									height={50}
									className="rounded"
								/>
								<h1 className="text-2xl font-bold text-[var(--color-primary)]">Dashboard {theme.brand.name.split(' ')[0]}</h1>
							</div>
							<button
								onClick={async () => {
									try {
										await fetch('/api/auth/logout', { method: 'POST' })
										router.push('/autumn/login')
									} catch (error) {}
								}}
								className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
							>
								Logout
							</button>
						</div>
					</header>
					<main className="max-w-7xl mx-auto px-4 py-8">
						{children}
					</main>
				</div>
			) : (
				<>{children}</>
			)}
		</>
	)
}
