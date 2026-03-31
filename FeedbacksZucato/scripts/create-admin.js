#!/usr/bin/env node

/**
 * Script para criar usuário admin
 * Uso: node scripts/create-admin.js
 *
 * Cria o usuário no Supabase Auth e garante o vínculo com a tabela admins.
 */

// carregar variáveis de ambiente de .env.local (se existir)
require('dotenv').config({ path: '.env.local' })

const readline = require('readline')
const { createClient } = require('@supabase/supabase-js')
const { createHash } = require('crypto')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query) => {
  return new Promise((resolve) => rl.question(query, resolve))
}

function isMissingRoleColumn(error) {
  if (!error || typeof error !== 'object') {
    return false
  }

  if (error.code === '42703') {
    return true
  }

  if (!error.message || error.message.trim() === '') {
    return true
  }

  const combinedText = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return combinedText.includes('role') && (combinedText.includes('column') || combinedText.includes('schema cache'))
}

// Função para fazer hash do email com SHA-256
function hashEmail(email) {
  return createHash('sha256').update(email.toLowerCase()).digest('hex')
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

async function createOrReuseAuthUser(supabase, email, password) {
  const existingUser = await findAuthUserByEmail(supabase, email)
  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
    })

    if (error) {
      throw new Error(`Erro ao atualizar senha do usuário existente no Auth: ${error.message}`)
    }

    return {
      user: data.user || existingUser,
      reused: true,
    }
  }

  const authResult = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authResult.error) {
    const message = authResult.error.message.toLowerCase()

    if (message.includes('already') || message.includes('registered') || message.includes('exists')) {
      const duplicatedUser = await findAuthUserByEmail(supabase, email)
      if (duplicatedUser) {
        const { data, error } = await supabase.auth.admin.updateUserById(duplicatedUser.id, {
          password,
          email_confirm: true,
        })

        if (error) {
          throw new Error(`Erro ao atualizar senha do usuário existente no Auth: ${error.message}`)
        }

        return {
          user: data.user || duplicatedUser,
          reused: true,
        }
      }
    }

    throw new Error(`Erro ao criar usuário no Auth: ${authResult.error.message}`)
  }

  if (!authResult.data.user) {
    throw new Error('Erro ao criar usuário no Auth: resposta sem usuário')
  }

  return {
    user: authResult.data.user,
    reused: false,
  }
}

async function detectRoleSupport(supabase) {
  const { error } = await supabase
    .from('admins')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'owner')

  if (!error) {
    return true
  }

  if (isMissingRoleColumn(error)) {
    return false
  }

  throw new Error(`Erro ao verificar owner existente: ${error.message}`)
}

async function main() {
  try {
    console.log('\n🔐 Criar Usuário Admin com Supabase Auth - Clínica Zucato\n')

    // Validar variáveis de ambiente
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!url) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL não está configurada (edite .env.local)')
    }
    if (url.includes('your_supabase_url') || url.includes('test')) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL parece ser um valor de exemplo ou de teste; use a URL real do Supabase')
    }
    if (!key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada (edite .env.local)')
    }
    if (key.includes('your_supabase_service_role_key') || key.includes('test')) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY parece ser um valor de exemplo ou de teste; use a chave real do Supabase')
    }

    // Conectar ao Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Coletar input
    const email = await question('Email do admin: ')
    const password = await question('Senha: ')
    const confirmPassword = await question('Confirmar senha: ')

    // Validar inputs
    if (!email.includes('@')) {
      throw new Error('Email inválido')
    }
    if (password.length < 8) {
      throw new Error('Senha deve ter no mínimo 8 caracteres')
    }
    if (password !== confirmPassword) {
      throw new Error('Senhas não correspondem')
    }

    // Hash do email (SHA-256)
    console.log('⏳ Hasheando email (SHA-256)...')
    const normalizedEmail = email.trim().toLowerCase()
    const emailHash = hashEmail(normalizedEmail)

    console.log('⏳ Garantindo usuário no Supabase Auth...')
    const authResult = await createOrReuseAuthUser(supabase, normalizedEmail, password)

    console.log('⏳ Salvando vínculo na tabela admins...')
    const supportsRole = await detectRoleSupport(supabase)

    let role = 'admin'
    if (supportsRole) {
      const { count: ownerCount, error: ownerCountError } = await supabase
        .from('admins')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'owner')

      if (ownerCountError) {
        throw new Error(`Erro ao verificar owner existente: ${ownerCountError.message}`)
      }

      role = ownerCount === 0 ? 'owner' : 'admin'
    }

    const payload = {
      email: emailHash,
      auth_user_id: authResult.user.id,
      password_hash: 'SUPABASE_AUTH_MANAGED',
      invited_by_email: 'script:create-admin',
      is_active: true,
    }

    if (supportsRole) {
      payload.role = role
    }

    const { data, error } = await supabase
      .from('admins')
      .upsert([payload], {
        onConflict: 'email',
      })
      .select()

    if (error) {
      throw new Error(`Erro ao salvar: ${error.message}`)
    }

    console.log('\n✅ Admin criado com sucesso!\n')
    if (authResult.reused) {
      console.log('Conta existente no Supabase Auth foi reaproveitada.')
    }
    if (!supportsRole) {
      console.log('Banco ainda sem coluna role. Execute scripts/migration-admin-management.sql para habilitar owner/admin.')
    }
    console.log(`Email Auth: ${normalizedEmail}`)
    console.log(`Email Hash (armazenado): ${emailHash.slice(0, 16)}...`)
    console.log(`ID Auth: ${authResult.user.id}`)
    console.log(`ID Admin: ${data[0].id}`)
    console.log(`Papel: ${supportsRole ? data[0].role : 'admin (schema antigo)'}`)
    console.log(`Criado em: ${new Date(data[0].created_at).toLocaleString('pt-BR')}\n`)
    console.log('🎉 Você já pode fazer login em /autumn/login\n')
  } catch (error) {
    console.error('\n❌ Erro:', error.message, '\n')
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
