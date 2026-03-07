import { NextRequest, NextResponse } from 'next/server'
import { createToken, setAuthCookie } from '@/lib/auth'
import { verifyPassword, sanitizeInput } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabase'
import { decryptEmail } from '@/lib/crypto'

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

    // Buscar todos os admins (vamos comparar email descriptografado)
    const { data: allAdmins, error: selectError } = await supabaseAdmin
      .from('admins')
      .select('id, email, password_hash, is_active')

    if (selectError || !allAdmins || allAdmins.length === 0) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Procurar admin com email que corresponde (descriptografar e comparar)
    let foundAdmin = null
    for (const admin of allAdmins) {
      try {
        const decryptedEmail = decryptEmail(admin.email)
        if (decryptedEmail.toLowerCase() === sanitizedEmail.toLowerCase()) {
          foundAdmin = admin
          break
        }
      } catch (error) {
        // Email corrompido ou erro de descriptografia, continuar
        console.error('Erro ao descriptografar email do admin:', error)
      }
    }

    if (!foundAdmin) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Verificar se admin está ativo
    if (!foundAdmin.is_active) {
      return NextResponse.json(
        { error: 'Admin desativado' },
        { status: 401 }
      )
    }

    const data = foundAdmin

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, data.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Criar token com email descriptografado
    const decryptedAdminEmail = decryptEmail(data.email)
    const token = await createToken({
      id: data.id,
      email: decryptedAdminEmail,
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
