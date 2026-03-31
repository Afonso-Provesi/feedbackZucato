import { NextResponse } from 'next/server'

// Legado: esta rota foi preservada como referência da implementação original
// de autenticação manual. O fluxo atual usa Supabase Auth na interface.

export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint legado desativado. O login agora usa Supabase Auth diretamente na interface.',
    },
    { status: 410 }
  )
}
