import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await validateAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const dateFrom = req.nextUrl.searchParams.get('dateFrom')
    const dateTo = req.nextUrl.searchParams.get('dateTo')
    const page = req.nextUrl.searchParams.get('page') || 'index'

    let query = supabaseAdmin
      .from('page_views')
      .select('id, page, created_at')
      .eq('page', page)

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    const total = data?.length || 0
    const byDate: { [key: string]: number } = {}

    data?.forEach((view) => {
      const date = new Date(view.created_at).toLocaleDateString('pt-BR')
      byDate[date] = (byDate[date] || 0) + 1
    })

    return NextResponse.json(
      {
        total,
        byDate,
        page,
      },
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
