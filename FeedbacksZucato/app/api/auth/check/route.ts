import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await validateAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true, user: session }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao verificar autenticação' }, { status: 500 })
  }
}
