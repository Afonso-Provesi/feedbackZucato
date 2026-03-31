import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/auth'
import { getDentistPerformance } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  try {
    const session = await validateAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const performance = await getDentistPerformance()
    return NextResponse.json(performance, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar performance por dentista:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar performance por dentista' },
      { status: 500 }
    )
  }
}