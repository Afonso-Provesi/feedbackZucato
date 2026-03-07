import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  try {
    await clearAuthCookie()
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
