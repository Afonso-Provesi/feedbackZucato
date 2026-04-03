import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { listRecentSecurityInputEvents } from '@/lib/securityInputEvents'
import { normalizeIntegerInRange } from '@/lib/inputProtection'

export async function GET(req: NextRequest) {
  try {
    const session = await validateAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const limit = normalizeIntegerInRange(req.nextUrl.searchParams.get('limit'), 20, 1, 50)
    const events = await listRecentSecurityInputEvents(limit)

    return NextResponse.json(events, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar eventos de input suspeito:', error)
    return NextResponse.json({ error: 'Erro ao buscar eventos de segurança' }, { status: 500 })
  }
}