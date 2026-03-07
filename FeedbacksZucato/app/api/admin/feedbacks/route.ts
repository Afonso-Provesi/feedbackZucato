import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { getFeedbacks } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await validateAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const sentiment = req.nextUrl.searchParams.get('sentiment')
    const dateFrom = req.nextUrl.searchParams.get('dateFrom') || req.nextUrl.searchParams.get('startDate')
    const dateTo = req.nextUrl.searchParams.get('dateTo') || req.nextUrl.searchParams.get('endDate')

    const filters: any = {}
    if (sentiment && sentiment !== 'todos') {
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
