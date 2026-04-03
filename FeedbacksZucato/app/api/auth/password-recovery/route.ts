import { NextRequest, NextResponse } from 'next/server'
import { findAdminByEmail } from '@/lib/adminAuth'
import { sendPasswordRecoveryLink } from '@/lib/email2fa'
import { checkRateLimit, getClientIpFromHeaders, validateEmail } from '@/lib/security'
import { reportAdminSecurityEvent } from '@/lib/securityAlerts'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeEmailInput } from '@/lib/inputProtection'

function getRecoveryRedirectUrl(req: NextRequest): string {
  return `${req.nextUrl.origin}/autumn/login?mode=recovery`
}

async function findAuthEmailByUserId(authUserId: string | null | undefined) {
  if (!authUserId) {
    return null
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(authUserId)

  if (error) {
    if (error.message.toLowerCase().includes('not found')) {
      return null
    }

    throw error
  }

  return data.user?.email?.toLowerCase() || null
}

async function generateRecoveryLink(email: string, redirectTo: string) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo,
    },
  })

  if (error) {
    throw error
  }

  return data.properties.action_link
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(req.headers)

    const rateLimit = await checkRateLimit(`password-recovery:${ip}`, 5, 15 * 60 * 1000)

    if (!rateLimit.allowed) {
      await reportAdminSecurityEvent(req.headers, {
        eventType: 'password-recovery-abuse',
        requestPath: req.nextUrl.pathname,
        reason: 'Limite excedido para recuperação de senha administrativa',
      })

      return NextResponse.json(
        { error: 'Muitas tentativas de recuperação. Aguarde alguns minutos e tente novamente.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const email = normalizeEmailInput(body.email)

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const admin = await findAdminByEmail(email)

    if (!admin || !admin.is_active) {
      return NextResponse.json({ success: true, message: 'Se o email existir, enviaremos um link de recuperação.' })
    }

    const authEmail = (await findAuthEmailByUserId(admin.auth_user_id)) || email
    const actionLink = await generateRecoveryLink(authEmail, getRecoveryRedirectUrl(req))
    await sendPasswordRecoveryLink(authEmail, actionLink)

    return NextResponse.json({ success: true, message: 'Se o email existir, enviaremos um link de recuperação.' })
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error)

    const message =
      error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha'

    return NextResponse.json(
      { error: message },
      { status: /Gmail|SMTP/i.test(message) ? 503 : 500 }
    )
  }
}