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

// Função para fazer hash do email com SHA-256
function hashEmail(email) {
  return createHash('sha256').update(email.toLowerCase()).digest('hex')
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

    console.log('⏳ Criando usuário no Supabase Auth...')
    const authResult = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    })

    if (authResult.error) {
      throw new Error(`Erro ao criar usuário no Auth: ${authResult.error.message}`)
    }

    console.log('⏳ Salvando vínculo na tabela admins...')
    const { data, error } = await supabase
      .from('admins')
      .upsert([
        {
          email: emailHash,
          auth_user_id: authResult.data.user.id,
          password_hash: 'SUPABASE_AUTH_MANAGED',
          invited_by_email: 'script:create-admin',
          is_active: true,
        },
      ], {
        onConflict: 'email',
      })
      .select()

    if (error) {
      throw new Error(`Erro ao salvar: ${error.message}`)
    }

    console.log('\n✅ Admin criado com sucesso!\n')
    console.log(`Email Auth: ${normalizedEmail}`)
    console.log(`Email Hash (armazenado): ${emailHash.slice(0, 16)}...`)
    console.log(`ID Auth: ${authResult.data.user.id}`)
    console.log(`ID Admin: ${data[0].id}`)
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
