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
  }
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
