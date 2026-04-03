import { createClient } from '@supabase/supabase-js'
import type { SentimentType } from '@/lib/sentiment'

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
  dentist_sentiment?: SentimentType | null
  sentiment: SentimentType | null
  created_at?: string
  is_anonymous: boolean
  patient_name: string | null
  source: string
  device_fingerprint?: string
}

interface SentimentBreakdown {
  positivo: number
  negativo: number
  neutro: number
  misto: number
}

interface DashboardStats {
  total: number
  avgRating: number
  positivoPercent: string
  negativoPercent: string
  sentimentBreakdown: SentimentBreakdown
  clinicRatingDistribution: Array<{
    rating: number
    total: number
  }>
}

interface DentistPerformance {
  dentistName: string
  total: number
  avgRating: number
  aproveitamento: string
  sentimentBreakdown: SentimentBreakdown
}

interface PageViewStats {
  total: number
  byDate: Record<string, number>
  page: string
}

type AnalyticsCacheEntry<T> = {
  value: T
  expiresAt: number
}

const analyticsCache = new Map<string, AnalyticsCacheEntry<unknown>>()
const ANALYTICS_CACHE_TTL_MS = 30 * 1000

function getCachedValue<T>(key: string): T | null {
  const entry = analyticsCache.get(key)

  if (!entry) {
    return null
  }

  if (entry.expiresAt <= Date.now()) {
    analyticsCache.delete(key)
    return null
  }

  return entry.value as T
}

async function withAnalyticsCache<T>(key: string, loader: () => Promise<T>, ttlMs: number = ANALYTICS_CACHE_TTL_MS): Promise<T> {
  const cached = getCachedValue<T>(key)
  if (cached !== null) {
    return cached
  }

  const value = await loader()
  analyticsCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  })

  return value
}

export function invalidateAnalyticsCache(prefix?: string) {
  if (!prefix) {
    analyticsCache.clear()
    return
  }

  for (const key of analyticsCache.keys()) {
    if (key.startsWith(prefix)) {
      analyticsCache.delete(key)
    }
  }
}

function isMissingRpcFunction(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const message = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : ''
  const code = 'code' in error && typeof error.code === 'string' ? error.code.toLowerCase() : ''

  return code === 'pgrst202' || message.includes('could not find the function') || message.includes('function public.')
}

function formatPercent(value: number, total: number): string {
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0'
}

function normalizeNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeDashboardStats(data: any): DashboardStats {
  const total = normalizeNumber(data?.total)
  const avgRating = normalizeNumber(data?.avgRating)
  const positivo = normalizeNumber(data?.sentimentBreakdown?.positivo)
  const negativo = normalizeNumber(data?.sentimentBreakdown?.negativo)
  const neutro = normalizeNumber(data?.sentimentBreakdown?.neutro)
  const misto = normalizeNumber(data?.sentimentBreakdown?.misto)

  return {
    total,
    avgRating: Number(avgRating.toFixed(2)),
    positivoPercent: typeof data?.positivoPercent === 'string' ? data.positivoPercent : formatPercent(positivo, total),
    negativoPercent: typeof data?.negativoPercent === 'string' ? data.negativoPercent : formatPercent(negativo, total),
    sentimentBreakdown: {
      positivo,
      negativo,
      neutro,
      misto,
    },
    clinicRatingDistribution: Array.from({ length: 10 }, (_, index) => {
      const rating = index + 1
      const found = Array.isArray(data?.clinicRatingDistribution)
        ? data.clinicRatingDistribution.find((item: any) => normalizeNumber(item?.rating) === rating)
        : null

      return {
        rating,
        total: normalizeNumber(found?.total),
      }
    }),
  }
}

async function getFeedbackStatsFromRpc(): Promise<DashboardStats> {
  const { data, error } = await supabaseAdmin.rpc('dashboard_feedback_stats')

  if (error) {
    throw error
  }

  return normalizeDashboardStats(data)
}

async function getFeedbackStatsFallback(): Promise<DashboardStats> {
  const { data, error } = await supabaseAdmin
    .from('feedbacks')
    .select('rating, sentiment')

  if (error) throw error

  const distribution = Array.from({ length: 10 }, (_, index) => ({
    rating: index + 1,
    total: 0,
  }))

  let total = 0
  let ratingSum = 0
  let positivos = 0
  let negativos = 0
  let neutros = 0
  let mistos = 0

  for (const item of data || []) {
    const rating = normalizeNumber(item.rating)
    total += 1
    ratingSum += rating

    if (rating >= 1 && rating <= 10) {
      distribution[rating - 1].total += 1
    }

    if (item.sentiment === 'positivo') positivos += 1
    if (item.sentiment === 'negativo') negativos += 1
    if (item.sentiment === 'neutro') neutros += 1
    if (item.sentiment === 'misto') mistos += 1
  }

  return {
    total,
    avgRating: total > 0 ? Number((ratingSum / total).toFixed(2)) : 0,
    positivoPercent: formatPercent(positivos, total),
    negativoPercent: formatPercent(negativos, total),
    sentimentBreakdown: {
      positivo: positivos,
      negativo: negativos,
      neutro: neutros,
      misto: mistos,
    },
    clinicRatingDistribution: distribution,
  }
}

function normalizeDentistPerformanceRows(data: any[]): DentistPerformance[] {
  return data.map((item) => ({
    dentistName: String(item?.dentist_name || item?.dentistName || 'Todos os dentistas'),
    total: normalizeNumber(item?.total),
    avgRating: Number(normalizeNumber(item?.avg_rating ?? item?.avgRating).toFixed(2)),
    aproveitamento: normalizeNumber(item?.aproveitamento).toFixed(1),
    sentimentBreakdown: {
      positivo: normalizeNumber(item?.positivo ?? item?.sentimentBreakdown?.positivo),
      negativo: normalizeNumber(item?.negativo ?? item?.sentimentBreakdown?.negativo),
      neutro: normalizeNumber(item?.neutro ?? item?.sentimentBreakdown?.neutro),
      misto: normalizeNumber(item?.misto ?? item?.sentimentBreakdown?.misto),
    },
  }))
}

async function getDentistPerformanceFromRpc(): Promise<DentistPerformance[]> {
  const { data, error } = await supabaseAdmin.rpc('dashboard_dentist_performance')

  if (error) {
    throw error
  }

  return normalizeDentistPerformanceRows(Array.isArray(data) ? data : [])
}

async function getDentistPerformanceFallback(): Promise<DentistPerformance[]> {
  const { data, error } = await supabaseAdmin
    .from('feedbacks')
    .select('dentist_name, dentist_rating, dentist_sentiment')
    .not('dentist_name', 'is', null)

  if (error) throw error

  const grouped = new Map<string, {
    total: number
    ratingSum: number
    ratingCount: number
    positivo: number
    negativo: number
    neutro: number
    misto: number
  }>()

  const overall = {
    total: 0,
    ratingSum: 0,
    ratingCount: 0,
    positivo: 0,
    negativo: 0,
    neutro: 0,
    misto: 0,
  }

  for (const item of data || []) {
    if (!item.dentist_name) {
      continue
    }

    if (!grouped.has(item.dentist_name)) {
      grouped.set(item.dentist_name, {
        total: 0,
        ratingSum: 0,
        ratingCount: 0,
        positivo: 0,
        negativo: 0,
        neutro: 0,
        misto: 0,
      })
    }

    const current = grouped.get(item.dentist_name)!
    const dentistRating = normalizeNumber(item.dentist_rating)

    current.total += 1
    overall.total += 1

    if (dentistRating > 0) {
      current.ratingSum += dentistRating
      current.ratingCount += 1
      overall.ratingSum += dentistRating
      overall.ratingCount += 1
    }

    if (item.dentist_sentiment === 'positivo') {
      current.positivo += 1
      overall.positivo += 1
    }

    if (item.dentist_sentiment === 'negativo') {
      current.negativo += 1
      overall.negativo += 1
    }

    if (item.dentist_sentiment === 'neutro') {
      current.neutro += 1
      overall.neutro += 1
    }

    if (item.dentist_sentiment === 'misto') {
      current.misto += 1
      overall.misto += 1
    }
  }

  const formatPerformance = (dentistName: string, values: typeof overall): DentistPerformance => ({
    dentistName,
    total: values.total,
    avgRating: values.ratingCount > 0 ? Number((values.ratingSum / values.ratingCount).toFixed(2)) : 0,
    aproveitamento: values.total > 0
      ? (((values.positivo + values.neutro * 0.5 + values.misto * 0.25) / values.total) * 100).toFixed(1)
      : '0.0',
    sentimentBreakdown: {
      positivo: values.positivo,
      negativo: values.negativo,
      neutro: values.neutro,
      misto: values.misto,
    },
  })

  return [
    formatPerformance('Todos os dentistas', overall),
    ...Array.from(grouped.entries())
      .map(([dentistName, values]) => formatPerformance(dentistName, values))
      .sort((a, b) => a.dentistName.localeCompare(b.dentistName, 'pt-BR')),
  ]
}

async function getFeedbackEvolutionFromRpc(days: number): Promise<Array<{ date: string; media: string }>> {
  const { data, error } = await supabaseAdmin.rpc('dashboard_feedback_evolution', {
    input_days: days,
  })

  if (error) {
    throw error
  }

  return (Array.isArray(data) ? data : []).map((item) => ({
    date: String(item?.date || ''),
    media: normalizeNumber(item?.media).toFixed(2),
  }))
}

async function getFeedbackEvolutionFallback(days: number): Promise<Array<{ date: string; media: string }>> {
  const { data, error } = await supabaseAdmin
    .from('feedbacks')
    .select('created_at, rating')
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error

  const grouped = new Map<string, { total: number; sum: number }>()

  for (const item of data || []) {
    const date = new Date(item.created_at).toLocaleDateString('pt-BR')
    const current = grouped.get(date) || { total: 0, sum: 0 }
    current.total += 1
    current.sum += normalizeNumber(item.rating)
    grouped.set(date, current)
  }

  return Array.from(grouped.entries()).map(([date, values]) => ({
    date,
    media: (values.sum / values.total).toFixed(2),
  }))
}

function normalizePageViewStats(data: any, page: string): PageViewStats {
  const byDate = Object.fromEntries(
    Object.entries(data?.byDate || {}).map(([date, total]) => [date, normalizeNumber(total)])
  )

  return {
    total: normalizeNumber(data?.total),
    byDate,
    page: String(data?.page || page),
  }
}

async function getPageViewStatsFromRpc(page: string, dateFrom?: string, dateTo?: string): Promise<PageViewStats> {
  const { data, error } = await supabaseAdmin.rpc('dashboard_page_view_stats', {
    input_page: page,
    input_date_from: dateFrom || null,
    input_date_to: dateTo || null,
  })

  if (error) {
    throw error
  }

  return normalizePageViewStats(data, page)
}

async function getPageViewStatsFallback(page: string, dateFrom?: string, dateTo?: string): Promise<PageViewStats> {
  let totalQuery = supabaseAdmin
    .from('page_views')
    .select('id', { count: 'exact', head: true })
    .eq('page', page)

  let byDateQuery = supabaseAdmin
    .from('page_views')
    .select('created_at')
    .eq('page', page)

  if (dateFrom) {
    totalQuery = totalQuery.gte('created_at', dateFrom)
    byDateQuery = byDateQuery.gte('created_at', dateFrom)
  }

  if (dateTo) {
    totalQuery = totalQuery.lte('created_at', dateTo)
    byDateQuery = byDateQuery.lte('created_at', dateTo)
  }

  const [{ count, error: totalError }, { data, error: byDateError }] = await Promise.all([
    totalQuery,
    byDateQuery.order('created_at', { ascending: false }),
  ])

  if (totalError) throw totalError
  if (byDateError) throw byDateError

  const byDate: Record<string, number> = {}

  for (const item of data || []) {
    const date = new Date(item.created_at).toLocaleDateString('pt-BR')
    byDate[date] = (byDate[date] || 0) + 1
  }

  return {
    total: count || 0,
    byDate,
    page,
  }
}

export async function saveFeedback(feedback: Feedback) {
  const { error } = await supabase
    .from('feedbacks')
    .insert([feedback])

  if (error) throw error
  invalidateAnalyticsCache('feedback:')
  // não retornamos a linha inserida ao cliente anônimo para evitar problemas com RLS
  return null
}

export async function getFeedbacks(filters?: {
  sentiment?: string
  startDate?: string
  endDate?: string
}) {
  let query = supabaseAdmin.from('feedbacks').select(
    'id, rating, comment, dentist_name, dentist_rating, dentist_comment, dentist_sentiment, sentiment, created_at, is_anonymous'
  )

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
  return withAnalyticsCache('feedback:stats', async () => {
    try {
      return await getFeedbackStatsFromRpc()
    } catch (error) {
      if (!isMissingRpcFunction(error)) {
        throw error
      }

      return getFeedbackStatsFallback()
    }
  })
}

export async function getDentistPerformance() {
  return withAnalyticsCache('feedback:dentist-performance', async () => {
    try {
      return await getDentistPerformanceFromRpc()
    } catch (error) {
      if (!isMissingRpcFunction(error)) {
        throw error
      }

      return getDentistPerformanceFallback()
    }
  })
}

export async function getFeedbackEvolution(days: number = 30) {
  return withAnalyticsCache(`feedback:evolution:${days}`, async () => {
    try {
      return await getFeedbackEvolutionFromRpc(days)
    } catch (error) {
      if (!isMissingRpcFunction(error)) {
        throw error
      }

      return getFeedbackEvolutionFallback(days)
    }
  })
}

export async function getPageViewStats(page: string, dateFrom?: string, dateTo?: string): Promise<PageViewStats> {
  const cacheKey = `page-views:${page}:${dateFrom || ''}:${dateTo || ''}`

  return withAnalyticsCache(cacheKey, async () => {
    try {
      return await getPageViewStatsFromRpc(page, dateFrom, dateTo)
    } catch (error) {
      if (!isMissingRpcFunction(error)) {
        throw error
      }

      return getPageViewStatsFallback(page, dateFrom, dateTo)
    }
  })
}
