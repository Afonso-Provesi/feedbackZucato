import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/security'
import { invalidateAnalyticsCache, supabaseAdmin } from '@/lib/supabase'
import { isValidTrackedPageInput, sanitizeTextField } from '@/lib/inputProtection'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const page = sanitizeTextField(body.page, { maxLength: 120 })

    if (!page) {
      return NextResponse.json({ error: 'Page name is required' }, { status: 400 })
    }

    if (!isValidTrackedPageInput(page)) {
      return NextResponse.json({ error: 'Page name is invalid' }, { status: 400 })
    }

    const ip = getClientIpFromHeaders(req.headers)
    const rateLimit = await checkRateLimit(`page-view:${ip}:${page}`, 30, 60000)

    if (!rateLimit.allowed) {
      return NextResponse.json({ success: true, throttled: true }, { status: 202 })
    }

    const userAgent = req.headers.get('user-agent') || 'unknown'

    const { error } = await supabaseAdmin.from('page_views').insert({
      page,
      ip_address: ip,
      user_agent: userAgent,
    })

    if (error) {
      console.error('Erro ao inserir page view:', error)
      return NextResponse.json({ error: 'Erro ao rastrear visualização' }, { status: 500 })
    }

    invalidateAnalyticsCache('page-views:')

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Erro no track-page-view:', error)
    return NextResponse.json(
      { error: 'Erro ao rastrear visualização' },
      { status: 500 }
    )
  }
}
