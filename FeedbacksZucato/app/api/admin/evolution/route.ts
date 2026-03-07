import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { getFeedbackEvolution } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await validateAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const days = Number(req.nextUrl.searchParams.get('days')) || 30
    const evolution = await getFeedbackEvolution(days)

    return NextResponse.json(evolution, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar evolução:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar evolução' },
      { status: 500 }
    )
  }
}
