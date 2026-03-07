import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { page } = body

    if (!page) {
      return NextResponse.json({ error: 'Page name is required' }, { status: 400 })
    }

    // Obter IP do cliente
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown'

    // Obter User-Agent
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Inserir no banco de dados
    const { error } = await supabaseAdmin.from('page_views').insert({
      page,
      ip_address: ip.trim(),
      user_agent: userAgent,
    })

    if (error) {
      console.error('Erro ao inserir page view:', error)
      return NextResponse.json({ error: 'Erro ao rastrear visualização' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Erro no track-page-view:', error)
    return NextResponse.json(
      { error: 'Erro ao rastrear visualização' },
      { status: 500 }
    )
  }
}
