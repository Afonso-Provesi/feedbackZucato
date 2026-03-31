'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast, { Toaster } from 'react-hot-toast'
import { getCurrentAdminPath } from '@/lib/adminPath'

export default function AdminLoginPage() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [adminPath, setAdminPath] = useState('')

	useEffect(() => {
		const path = getCurrentAdminPath()
		setAdminPath(path)
	}, [])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			})
			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Erro ao fazer login')
			}
			toast.success('Login realizado com sucesso!')
			setTimeout(() => {
				router.push(adminPath)
			}, 1500)
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Erro ao fazer login')
		} finally {
			setIsLoading(false)
		}
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
					<form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl p-8">
						<h2 className="text-2xl font-semibold text-gray-800 mb-6">Login do Admin</h2>
						<div className="mb-4">
							<label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
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
							<label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
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
							className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
							disabled={isLoading}
						>
							{isLoading ? 'Entrando...' : 'Entrar'}
						</button>
					</form>
				</div>
			</main>
		</>
	)
}
