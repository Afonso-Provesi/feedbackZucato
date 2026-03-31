'use client'

import { useState, useEffect } from 'react'
import DashboardCards from '@/components/DashboardCards'
import DashboardCharts from '@/components/DashboardCharts'
import FeedbackTable from '@/components/FeedbackTable'
import PageViewStats from '@/components/PageViewStats'
import toast, { Toaster } from 'react-hot-toast'

interface Stats {
	total: number
	avgRating: number
	positivoPercent: string
	negativoPercent: string
	sentimentBreakdown: {
		positivo: number
		negativo: number
		neutro: number
	}
}

interface Feedback {
	id: string
	rating: number
	comment: string | null
	sentiment: 'positivo' | 'negativo' | 'neutro' | null
	created_at: string
	patient_name: string | null
	is_anonymous: boolean
}

export default function DashboardPage() {
	const [stats, setStats] = useState<Stats | null>(null)
	const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
	const [evolution, setEvolution] = useState<Array<{ date: string; media: string }>>([])
	const [isLoading, setIsLoading] = useState(true)
	const [selectedSentiment, setSelectedSentiment] = useState('todos')
	const [dateFrom, setDateFrom] = useState('')
	const [dateTo, setDateTo] = useState('')

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true)
				const statsResponse = await fetch('/api/admin/stats')
				if (!statsResponse.ok) throw new Error('Erro ao buscar estatísticas')
				const statsData = await statsResponse.json()
				setStats(statsData)
				const evolutionResponse = await fetch('/api/admin/evolution')
				if (!evolutionResponse.ok) throw new Error('Erro ao buscar evolução')
				const evolutionData = await evolutionResponse.json()
				setEvolution(evolutionData)
				await handleFilter('todos')
			} catch (error) {
				console.error('Erro ao buscar dados:', error)
				toast.error('Erro ao carregar dashboard')
			} finally {
				setIsLoading(false)
			}
		}
		fetchData()
	}, [])

	const handleFilter = async (sentiment: string) => {
		try {
			let query = ''
			const params = new URLSearchParams()
			if (sentiment !== 'todos') params.append('sentiment', sentiment)
			if (dateFrom) params.append('dateFrom', dateFrom)
			if (dateTo) params.append('dateTo', dateTo)
			if (params.toString()) query = `?${params.toString()}`
			const response = await fetch(`/api/admin/feedbacks${query}`)
			if (!response.ok) throw new Error('Erro ao buscar feedbacks')
			const data = await response.json()
			setFeedbacks(data)
			setSelectedSentiment(sentiment)
		} catch (error) {
			console.error('Erro ao filtrar feedbacks:', error)
			toast.error('Erro ao filtrar feedbacks')
		}
	}

	return (
		<div>
			<Toaster position="top-center" />
			<DashboardCards
				avgRating={stats?.avgRating ?? 0}
				total={stats?.total ?? 0}
				positivoPercent={stats?.positivoPercent ?? '0'}
				negativoPercent={stats?.negativoPercent ?? '0'}
			/>
			<DashboardCharts
				evolution={evolution}
				sentimentBreakdown={stats?.sentimentBreakdown ?? { positivo: 0, negativo: 0, neutro: 0 }}
			/>
			<PageViewStats
				dateFrom={dateFrom}
				dateTo={dateTo}
				onFiltersChange={(from, to) => {
					setDateFrom(from)
					setDateTo(to)
				}}
			/>
			<FeedbackTable feedbacks={feedbacks} onFilter={handleFilter} />
		</div>
	)
}
