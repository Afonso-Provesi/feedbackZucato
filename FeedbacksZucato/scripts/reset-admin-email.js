#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const { createHash } = require('crypto')

function hashEmail(email) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

async function findAuthUserByEmail(supabase, email) {
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })

    if (error) {
      throw error
    }

    const found = data.users.find((user) => (user.email || '').trim().toLowerCase() === email)
    if (found) {
      return found
    }

    if (data.users.length < 200) {
      return null
    }

    page += 1
  }
}

async function main() {
  const rawEmail = process.argv[2] || ''
  const email = rawEmail.trim().toLowerCase()

  if (!email || !email.includes('@')) {
    throw new Error('Uso: npm run reset-admin-email -- email@dominio.com')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const emailHash = hashEmail(email)

  console.log(`\nResetando admin para: ${email}`)

  const { data: adminRow, error: adminLookupError } = await supabase
    .from('admins')
    .select('id, auth_user_id')
    .eq('email', emailHash)
    .maybeSingle()

  if (adminLookupError) {
    throw adminLookupError
  }

  if (adminRow) {
    const { error: adminDeleteError } = await supabase
      .from('admins')
      .delete()
      .eq('id', adminRow.id)

    if (adminDeleteError) {
      throw adminDeleteError
    }

    console.log(`- Registro removido da tabela admins: ${adminRow.id}`)
  } else {
    console.log('- Nenhum registro encontrado na tabela admins')
  }

  const authUser = await findAuthUserByEmail(supabase, email)

  if (authUser?.id) {
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUser.id)

    if (deleteAuthError) {
      throw deleteAuthError
    }

    console.log(`- Usuário removido do Supabase Auth: ${authUser.id}`)
  } else {
    console.log('- Nenhum usuário encontrado no Supabase Auth')
  }

  console.log('\nEmail liberado para novo teste.\n')
}

main().catch((error) => {
  console.error(`\nErro ao resetar email: ${error.message}\n`)
  process.exit(1)
})