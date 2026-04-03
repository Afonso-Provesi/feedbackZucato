#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    email: process.env.TEST_BRUTEFORCE_EMAIL || 'teste-alerta@exemplo.com',
    password: process.env.TEST_BRUTEFORCE_PASSWORD || 'SenhaErrada!123',
    attempts: 5,
    eventType: 'failed-login',
    ip: '203.0.113.10',
    path: '/autumn/login',
    reason: 'Falha de autenticação administrativa',
    mode: 'real-login',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if (current === '--base-url') {
      options.baseUrl = String(argv[index + 1] || '').trim() || options.baseUrl
      index += 1
      continue
    }

    if (current === '--email') {
      options.email = String(argv[index + 1] || '').trim() || options.email
      index += 1
      continue
    }

    if (current === '--attempts') {
      const parsedAttempts = Number.parseInt(String(argv[index + 1] || ''), 10)
      if (Number.isFinite(parsedAttempts) && parsedAttempts > 0) {
        options.attempts = parsedAttempts
      }
      index += 1
      continue
    }

    if (current === '--event-type') {
      const eventType = String(argv[index + 1] || '').trim()
      if (eventType === 'failed-login' || eventType === 'failed-mfa' || eventType === 'password-recovery-abuse') {
        options.eventType = eventType
      }
      index += 1
      continue
    }

    if (current === '--ip') {
      options.ip = String(argv[index + 1] || '').trim() || options.ip
      index += 1
      continue
    }

    if (current === '--password') {
      options.password = String(argv[index + 1] || '') || options.password
      index += 1
      continue
    }

    if (current === '--path') {
      options.path = String(argv[index + 1] || '').trim() || options.path
      index += 1
      continue
    }

    if (current === '--reason') {
      options.reason = String(argv[index + 1] || '').trim() || options.reason
      index += 1
      continue
    }

    if (current === '--mode') {
      const mode = String(argv[index + 1] || '').trim()
      if (mode === 'simulate' || mode === 'real-login') {
        options.mode = mode
      }
      index += 1
    }
  }

  return options
}

function createSupabaseAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios para o modo real-login')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

async function sendAttempt(baseUrl, payload, ip, attempt) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/security/admin-access-alert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip,
      'User-Agent': 'zucato-bruteforce-test/1.0',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`Tentativa ${attempt}: HTTP ${response.status} - ${data.error || 'falha ao acionar endpoint'}`)
  }

  return data
}

async function attemptRealLogin(options, attempt) {
  const supabase = createSupabaseAnonClient()
  const normalizedEmail = options.email.trim().toLowerCase()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: options.password,
    })

    if (error) {
      throw error
    }

    await supabase.auth.signOut()

    return {
      loginSucceeded: true,
      loginError: `Login real concluído para ${data.user?.email || normalizedEmail}; use uma senha incorreta para testar brute force`,
    }
  } catch (error) {
    return {
      loginSucceeded: false,
      loginError: error instanceof Error ? error.message : 'Falha de autenticação administrativa',
    }
  }
}

async function run() {
  const options = parseArgs(process.argv.slice(2))

  console.log(`Executando ${options.attempts} tentativa(s) no modo ${options.mode} contra ${options.baseUrl}`)
  console.log(`Email alvo: ${options.email}`)
  console.log(`IP simulado: ${options.ip}`)

  let lastResult = null

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    let reason = `${options.reason} (tentativa ${attempt})`

    if (options.mode === 'real-login') {
      const loginResult = await attemptRealLogin(options, attempt)

      if (loginResult.loginSucceeded) {
        throw new Error(loginResult.loginError)
      }

      reason = loginResult.loginError
      console.log(`Tentativa ${attempt}: login real recusado com a mensagem "${reason}"`)
    }

    lastResult = await sendAttempt(
      options.baseUrl,
      {
        eventType: options.eventType,
        attemptedEmail: options.email,
        reason,
        requestPath: options.path,
      },
      options.ip,
      attempt
    )

    console.log(
      `Tentativa ${attempt}: attempts=${lastResult.attempts} notified=${String(lastResult.notified)} cooldown=${String(Boolean(lastResult.cooldown))}`
    )
  }

  if (!lastResult) {
    throw new Error('Nenhum resultado retornado pelo endpoint de alertas')
  }

  if (lastResult.notified) {
    console.log('Alerta disparado com sucesso. Verifique a caixa de entrada do email configurado em SECURITY_ALERT_EMAILS.')
    return
  }

  if (lastResult.cooldown) {
    console.log('O detector entrou em cooldown. Troque o --ip ou --email para gerar um novo alerta imediatamente.')
    return
  }

  console.log('O limiar ainda não foi atingido. Rode novamente com --attempts maior ou use outro conjunto IP/email.')
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Falha ao testar alerta de brute force')
  process.exit(1)
})