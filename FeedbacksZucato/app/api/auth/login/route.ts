import { NextRequest, NextResponse } from 'next/server'
import { createToken, setAuthCookie } from '@/lib/auth'
import { verifyPassword, sanitizeInput } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabase'
import { hashEmail } from '@/lib/crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Validar inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const sanitizedEmail = sanitizeInput(email)
    const emailHash = hashEmail(sanitizedEmail)

    // Buscar admin por email hash
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, password_hash, is_active')
      .eq('email', emailHash)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Verificar se admin está ativo
    if (!data.is_active) {
      return NextResponse.json(
        { error: 'Admin desativado' },
        { status: 401 }
      )
    }

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, data.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Criar token com email original (não hash)
    const token = await createToken({
      id: data.id,
      email: sanitizedEmail,
    })

    // Setar cookie
    await setAuthCookie(token)

    return NextResponse.json(
      { success: true, message: 'Login realizado com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
