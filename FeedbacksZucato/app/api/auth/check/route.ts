import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { validateSupabaseAdminAccessToken } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

    const session = bearerToken
      ? await validateSupabaseAdminAccessToken(bearerToken)
      : await validateAdminSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true, user: session }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao verificar autenticação' }, { status: 500 })
  }
}
