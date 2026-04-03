import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { getFeedbacks } from '@/lib/supabase'
import { isValidDashboardDateInput, sanitizeTextField } from '@/lib/inputProtection'

const ALLOWED_SENTIMENTS = new Set(['todos', 'positivo', 'negativo', 'neutro'])

export async function GET(req: NextRequest) {
  try {
    const session = await validateAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const sentiment = sanitizeTextField(req.nextUrl.searchParams.get('sentiment') || 'todos', { maxLength: 16 })
    const dateFrom = sanitizeTextField(req.nextUrl.searchParams.get('dateFrom') || req.nextUrl.searchParams.get('startDate'), { maxLength: 10 })
    const dateTo = sanitizeTextField(req.nextUrl.searchParams.get('dateTo') || req.nextUrl.searchParams.get('endDate'), { maxLength: 10 })

    if (!ALLOWED_SENTIMENTS.has(sentiment)) {
      return NextResponse.json({ error: 'Filtro de sentimento inválido' }, { status: 400 })
    }

    if (dateFrom && !isValidDashboardDateInput(dateFrom)) {
      return NextResponse.json({ error: 'Data inicial inválida' }, { status: 400 })
    }

    if (dateTo && !isValidDashboardDateInput(dateTo)) {
      return NextResponse.json({ error: 'Data final inválida' }, { status: 400 })
    }

    const filters: any = {}
    if (sentiment !== 'todos') {
      filters.sentiment = sentiment
    }
    if (dateFrom) filters.startDate = dateFrom
    if (dateTo) filters.endDate = dateTo

    const feedbacks = await getFeedbacks(filters)
    return NextResponse.json(feedbacks, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar feedbacks:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar feedbacks' },
      { status: 500 }
    )
  }
}
