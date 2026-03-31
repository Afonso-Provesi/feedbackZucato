import { NextResponse } from 'next/server'
import {
  clearAuthCookie,
  clearTrustedAdminCookie,
  clearTwoFactorChallengeCookie,
} from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-auth/server'

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()
    await clearAuthCookie()
    await clearTrustedAdminCookie()
    await clearTwoFactorChallengeCookie()

    return NextResponse.json(
      { success: true, message: 'Logout realizado com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    )
  }
}
