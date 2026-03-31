import { NextRequest, NextResponse } from 'next/server'
import { send2FACode, generate2FACode, store2FACode, verify2FACode } from '@/lib/email2fa'
import { supabaseAdmin } from '@/lib/supabase'
import { hashEmail } from '@/lib/crypto'
import { sanitizeInput } from '@/lib/security'

// POST /api/auth/2fa - Envia código para email do admin
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }
    const sanitizedEmail = sanitizeInput(email)
    const emailHash = hashEmail(sanitizedEmail)
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, is_active')
      .eq('email', emailHash)
      .single()
    if (error || !data || !data.is_active) {
      return NextResponse.json({ error: 'Admin não encontrado ou inativo' }, { status: 404 })
    }
    const code = generate2FACode()
    store2FACode(sanitizedEmail, code)
    await send2FACode(sanitizedEmail, code)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao enviar código 2FA' }, { status: 500 })
  }
}

// POST /api/auth/2fa/verify - Verifica código
export async function PUT(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ error: 'Email e código são obrigatórios' }, { status: 400 })
    }
    const sanitizedEmail = sanitizeInput(email)
    const valid = verify2FACode(sanitizedEmail, code)
    if (!valid) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 401 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao verificar código 2FA' }, { status: 500 })
  }
}
