import { NextRequest, NextResponse } from 'next/server'
import { isAlertEventType, reportAdminSecurityEvent } from '@/lib/securityAlerts'
import { normalizeEmailInput, sanitizeTextField } from '@/lib/inputProtection'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const eventType = body?.eventType

    if (!isAlertEventType(eventType)) {
      return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 })
    }

    const result = await reportAdminSecurityEvent(req.headers, {
      eventType,
      attemptedEmail: normalizeEmailInput(body?.attemptedEmail),
      reason: sanitizeTextField(body?.reason, { maxLength: 240 }),
      requestPath: sanitizeTextField(body?.requestPath || req.nextUrl.pathname, { maxLength: 120 }),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao registrar alerta de acesso administrativo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao registrar alerta' },
      { status: 500 }
    )
  }
}