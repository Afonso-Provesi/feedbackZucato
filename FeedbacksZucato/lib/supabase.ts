import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

export interface Feedback {
  id?: string
  rating: number
  comment: string | null
  dentist_name?: string | null
  dentist_rating?: number | null
  dentist_comment?: string | null
  dentist_sentiment?: 'positivo' | 'neutro' | 'negativo' | null
  sentiment: 'positivo' | 'neutro' | 'negativo' | null
  created_at?: string
  is_anonymous: boolean
  patient_name: string | null
  source: string
  device_fingerprint?: string
}

export async function saveFeedback(feedback: Feedback) {
  const { error } = await supabase
    .from('feedbacks')
    .insert([feedback])

  if (error) throw error
  // não retornamos a linha inserida ao cliente anônimo para evitar problemas com RLS
  return null
}

export async function getFeedbacks(filters?: {
  sentiment?: string
  startDate?: string
  endDate?: string
}) {
  let query = supabaseAdmin.from('feedbacks').select('*')

  if (filters?.sentiment && filters.sentiment !== 'todos') {
    query = query.eq('sentiment', filters.sentiment)
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getFeedbackStats() {
  const { data, error } = await supabaseAdmin
    .from('feedbacks')
    .select('rating, sentiment')

  if (error) throw error

  const total = data.length
  const avgRating = total > 0 ? (data.reduce((sum: number, f: any) => sum + f.rating, 0) / total).toFixed(2) : '0'
  const positivos = data.filter((f: any) => f.sentiment === 'positivo').length
  const negativos = data.filter((f: any) => f.sentiment === 'negativo').length
  const neutros = data.filter((f: any) => f.sentiment === 'neutro').length
  const clinicRatingDistribution = Array.from({ length: 10 }, (_, index) => {
    const score = index + 1
    return {
      rating: score,
      total: data.filter((f: any) => f.rating === score).length,
    }
  })

  return {
    total,
    avgRating: parseFloat(avgRating),
    positivoPercent: total > 0 ? ((positivos / total) * 100).toFixed(1) : '0',
    negativoPercent: total > 0 ? ((negativos / total) * 100).toFixed(1) : '0',
    sentimentBreakdown: {
      positivo: positivos,
      negativo: negativos,
      neutro: neutros,
    },
    clinicRatingDistribution,
  }
}

export async function getDentistPerformance() {
  const { data, error } = await supabaseAdmin
    .from('feedbacks')
    .select('dentist_name, dentist_rating, dentist_sentiment')
    .not('dentist_name', 'is', null)

  if (error) throw error

  const grouped = new Map<string, {
    total: number
    ratings: number[]
    positivo: number
    negativo: number
    neutro: number
  }>()

  const overall = {
    total: 0,
    ratings: [] as number[],
    positivo: 0,
    negativo: 0,
    neutro: 0,
  }

  data.forEach((item: any) => {
    if (!item.dentist_name) {
      return
    }

    if (!grouped.has(item.dentist_name)) {
      grouped.set(item.dentist_name, {
        total: 0,
        ratings: [],
        positivo: 0,
        negativo: 0,
        neutro: 0,
      })
    }

    const current = grouped.get(item.dentist_name)!
    current.total += 1
    overall.total += 1

    if (typeof item.dentist_rating === 'number') {
      current.ratings.push(item.dentist_rating)
      overall.ratings.push(item.dentist_rating)
    }

    if (item.dentist_sentiment === 'positivo') current.positivo += 1
    if (item.dentist_sentiment === 'negativo') current.negativo += 1
    if (item.dentist_sentiment === 'neutro') current.neutro += 1
    if (item.dentist_sentiment === 'positivo') overall.positivo += 1
    if (item.dentist_sentiment === 'negativo') overall.negativo += 1
    if (item.dentist_sentiment === 'neutro') overall.neutro += 1
  })

  const formatPerformance = (dentistName: string, values: typeof overall) => {
    const avgRating = values.ratings.length > 0
      ? values.ratings.reduce((sum, value) => sum + value, 0) / values.ratings.length
      : 0

    const aproveitamento = values.total > 0
      ? (((values.positivo + values.neutro * 0.5) / values.total) * 100).toFixed(1)
      : '0.0'

    return {
      dentistName,
      total: values.total,
      avgRating: Number(avgRating.toFixed(2)),
      aproveitamento,
      sentimentBreakdown: {
        positivo: values.positivo,
        negativo: values.negativo,
        neutro: values.neutro,
      },
    }
  }

  return [
    formatPerformance('Todos os dentistas', overall),
    ...Array.from(grouped.entries())
    .map(([dentistName, values]) => {
      return formatPerformance(dentistName, values)
    })
    .sort((a, b) => a.dentistName.localeCompare(b.dentistName, 'pt-BR'))
  ]
}

export async function getFeedbackEvolution(days: number = 30) {
  const { data, error } = await supabaseAdmin
    .from('feedbacks')
    .select('created_at, rating')
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  const grouped: Record<string, number[]> = {}

  data.forEach((item: any) => {
    const date = new Date(item.created_at).toLocaleDateString('pt-BR')
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(item.rating)
  })

  return Object.entries(grouped).map(([date, ratings]) => ({
    date,
    media: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2),
  }))
}
