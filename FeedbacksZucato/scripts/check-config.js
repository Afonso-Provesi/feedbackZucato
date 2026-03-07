#!/usr/bin/env node

/**
 * Script para verificar configuração do ambiente
 * Uso: node scripts/check-config.js
 */

const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')

console.log('🔍 Verificando configuração do ambiente...\n')

// Verificar se .env.local existe
if (!fs.existsSync(envPath)) {
  console.log('❌ Arquivo .env.local não encontrado')
  console.log('📝 Execute: cp .env.example .env.local')
  console.log('📝 Depois edite .env.local com suas credenciais do Supabase\n')
  process.exit(1)
}

// Ler arquivo .env.local
const envContent = fs.readFileSync(envPath, 'utf8')
const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))

const config = {}
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    config[key.trim()] = valueParts.join('=').trim()
  }
})

// Verificar configurações críticas
const checks = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    name: 'URL do Supabase',
    required: true,
    invalidValues: ['your_supabase_url', '']
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    name: 'Chave Anônima do Supabase',
    required: true,
    invalidValues: ['your_supabase_anon_key', '']
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    name: 'Chave Service Role do Supabase',
    required: true,
    invalidValues: ['your_supabase_service_role_key', '']
  },
  {
    key: 'ADMIN_SECRET',
    name: 'Secret do Admin',
    required: true,
    invalidValues: ['your_secure_admin_secret', '']
  }
]

let allGood = true

checks.forEach(check => {
  const value = config[check.key]

  if (!value && check.required) {
    console.log(`❌ ${check.name}: Não configurada`)
    allGood = false
  } else if (check.invalidValues.includes(value)) {
    console.log(`❌ ${check.name}: Valor padrão não alterado`)
    allGood = false
  } else {
    console.log(`✅ ${check.name}: Configurada`)
  }
})

console.log('')

if (allGood) {
  console.log('🎉 Todas as configurações estão corretas!')
  console.log('🚀 Você pode executar: npm run dev\n')
} else {
  console.log('⚠️  Algumas configurações precisam ser ajustadas.')
  console.log('📝 Edite o arquivo .env.local com suas credenciais reais do Supabase.')
  console.log('🔗 Obtenha as credenciais em: https://supabase.com/dashboard\n')
}

console.log('📋 Próximos passos:')
console.log('1. Configure o Supabase (se ainda não fez)')
console.log('2. Execute o SQL em database.sql no Supabase')
console.log('3. Crie um admin: node scripts/create-admin.js')
console.log('4. Execute: npm run dev')
console.log('5. Teste o sistema!\n')