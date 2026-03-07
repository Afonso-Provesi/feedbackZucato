#!/usr/bin/env node

/**
 * Script para criar usuário admin
 * Uso: node scripts/create-admin.js
 * 
 * Pede email e senha interativamente e salva no Supabase
 */

// carregar variáveis de ambiente de .env.local (se existir)
require('dotenv').config({ path: '.env.local' })

const readline = require('readline')
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const { createCipheriv, randomBytes, createHash } = require('crypto')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query) => {
  return new Promise((resolve) => rl.question(query, resolve))
}

// Função para criptografar email
function encryptEmail(email) {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-insecure-key-change-in-prodxxxxxxxxxxxxx'
  let keyBuffer
  if (ENCRYPTION_KEY.length >= 32) {
    keyBuffer = Buffer.from(ENCRYPTION_KEY.slice(0, 32))
  } else {
    keyBuffer = createHash('sha256').update(ENCRYPTION_KEY).digest()
  }
  
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv)
  let encrypted = cipher.update(email, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

async function main() {
  try {
    console.log('\n🔐 Criar Usuário Admin - Clínica Zucato\n')

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

    // Hash da senha
    console.log('\n⏳ Gerando hash da senha...')
    const passwordHash = await bcrypt.hash(password, 10)

    // Criptografar email
    console.log('⏳ Criptografando email...')
    const encryptedEmail = encryptEmail(email)

    // Salvar no banco
    console.log('⏳ Salvando admin no banco...')
    const { data, error } = await supabase
      .from('admins')
      .insert([
        {
          email: encryptedEmail,
          password_hash: passwordHash,
          is_active: true,
        },
      ])
      .select()

    if (error) {
      throw new Error(`Erro ao salvar: ${error.message}`)
    }

    console.log('\n✅ Admin criado com sucesso!\n')
    console.log(`Email: ${email}`)
    console.log(`ID: ${data[0].id}`)
    console.log(`Criado em: ${new Date(data[0].created_at).toLocaleString('pt-BR')}\n`)
    console.log('🎉 Você já pode fazer login em /admin/login\n')
  } catch (error) {
    console.error('\n❌ Erro:', error.message, '\n')
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
