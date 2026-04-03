#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    ip: '198.51.100.77',
    dentistName: 'Dr. Gustavo Zucato',
    payload: `teste' OR '1'='1' --`,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if (current === '--base-url') {
      options.baseUrl = String(argv[index + 1] || '').trim() || options.baseUrl
      index += 1
      continue
    }

    if (current === '--ip') {
      options.ip = String(argv[index + 1] || '').trim() || options.ip
      index += 1
      continue
    }

    if (current === '--payload') {
      options.payload = String(argv[index + 1] || '') || options.payload
      index += 1
      continue
    }

    if (current === '--dentist') {
      options.dentistName = String(argv[index + 1] || '').trim() || options.dentistName
      index += 1
    }
  }

  return options
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function readLatestSecurityEvent(supabase, ip, requestPath) {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('security_input_events')
    .select('id, source_scope, request_path, field_name, client_ip, payload_preview, reason, created_at')
    .eq('client_ip', ip)
    .eq('request_path', requestPath)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    const message = String(error.message || '').toLowerCase()
    if (message.includes('security_input_events') || message.includes('relation')) {
      console.log('Tabela security_input_events ainda não existe. Execute scripts/migration-security-input-events.sql para validar a auditoria persistente.')
      return null
    }

    throw error
  }

  return Array.isArray(data) && data.length > 0 ? data[0] : null
}

async function run() {
  const options = parseArgs(process.argv.slice(2))
  const requestPath = '/api/feedback'
  const response = await fetch(`${options.baseUrl.replace(/\/$/, '')}${requestPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': options.ip,
      'User-Agent': 'zucato-sql-injection-test/1.0',
    },
    body: JSON.stringify({
      rating: 8,
      comment: options.payload,
      dentistName: options.dentistName,
      dentistRating: 8,
      dentistComment: 'comentario normal',
      isAnonymous: true,
      source: 'automated-test',
    }),
  })

  const data = await response.json().catch(() => ({}))

  console.log(`HTTP ${response.status}`)
  console.log(data)

  if (response.status !== 400) {
    throw new Error('A proteção não bloqueou a carga suspeita como esperado.')
  }

  console.log('Bloqueio HTTP validado com sucesso.')

  const supabase = createSupabaseAdminClient()
  const latestEvent = await readLatestSecurityEvent(supabase, options.ip, requestPath)

  if (!latestEvent) {
    console.log('Nenhum evento persistido encontrado. Se a migration já foi aplicada, confira o dashboard em /autumn/audit.')
    return
  }

  console.log('Evento persistido encontrado:')
  console.log(latestEvent)
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Falha ao testar proteção de input')
  process.exit(1)
})