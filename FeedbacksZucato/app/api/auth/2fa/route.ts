import { NextResponse } from 'next/server'

// Legado: esta rota foi preservada como referência do antigo 2FA por email.
// O fluxo atual usa MFA TOTP do Supabase Auth.

export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint legado desativado. A autenticação agora usa MFA TOTP do Supabase Auth.',
    },
    { status: 410 }
  )
}

export async function PUT() {
  return NextResponse.json(
    {
      error: 'Endpoint legado desativado. A autenticação agora usa MFA TOTP do Supabase Auth.',
    },
    { status: 410 }
  )
}
