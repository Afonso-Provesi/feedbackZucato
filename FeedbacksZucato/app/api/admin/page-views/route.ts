import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { getPageViewStats } from '@/lib/supabase'
import { isValidDashboardDateInput, isValidTrackedPageInput, sanitizeTextField } from '@/lib/inputProtection'

export async function GET(req: NextRequest) {
  try {
    const session = await validateAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const dateFrom = sanitizeTextField(req.nextUrl.searchParams.get('dateFrom'), { maxLength: 10 })
    const dateTo = sanitizeTextField(req.nextUrl.searchParams.get('dateTo'), { maxLength: 10 })
    const page = sanitizeTextField(req.nextUrl.searchParams.get('page') || 'index', { maxLength: 120 })

    if (dateFrom && !isValidDashboardDateInput(dateFrom)) {
      return NextResponse.json({ error: 'Data inicial inválida' }, { status: 400 })
    }

    if (dateTo && !isValidDashboardDateInput(dateTo)) {
      return NextResponse.json({ error: 'Data final inválida' }, { status: 400 })
    }

    if (!isValidTrackedPageInput(page)) {
      return NextResponse.json({ error: 'Página inválida' }, { status: 400 })
    }

    const stats = await getPageViewStats(page, dateFrom || undefined, dateTo || undefined)

    return NextResponse.json(
      stats,
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao buscar estatísticas de página:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
