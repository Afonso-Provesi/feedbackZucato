#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const nodemailer = require('nodemailer')

function parseArgs(argv) {
  const result = {
    verifyOnly: false,
    sendTo: '',
    profile: 'recovery',
    link: process.env.RECOVERY_TEST_LINK || 'https://example.com/autumn/login?mode=recovery',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if (current === '--verify-only') {
      result.verifyOnly = true
      continue
    }

    if (current === '--send') {
      result.sendTo = String(argv[index + 1] || '').trim()
      index += 1
      continue
    }

    if (current === '--profile') {
      const profile = String(argv[index + 1] || '').trim().toLowerCase()
      if (profile === 'recovery' || profile === 'security-alert') {
        result.profile = profile
      }
      index += 1
      continue
    }

    if (current === '--link') {
      result.link = String(argv[index + 1] || '').trim() || result.link
      index += 1
    }
  }

  return result
}

function getProfileEnv(profile, key) {
  if (profile === 'security-alert') {
    return (
      process.env[`SECURITY_ALERT_SMTP_${key}`] ||
      process.env[`RECOVERY_SMTP_${key}`] ||
      process.env[`SMTP_${key}`]
    )
  }

  return process.env[`RECOVERY_SMTP_${key}`] || process.env[`SMTP_${key}`]
}

function isGmailProfile(profile) {
  const host = String(getProfileEnv(profile, 'HOST') || '').trim().toLowerCase()
  const user = String(getProfileEnv(profile, 'USER') || '').trim().toLowerCase()

  return (
    host === 'smtp.gmail.com' ||
    host === 'smtp.googlemail.com' ||
    user.endsWith('@gmail.com') ||
    user.endsWith('@googlemail.com')
  )
}

function getGmailSetupHint(profile) {
  const prefix = profile === 'security-alert' ? 'SECURITY_ALERT_SMTP' : 'RECOVERY_SMTP'
  return `Para Gmail, configure ${prefix}_PASS com uma senha de app de 16 caracteres do Google. A senha normal da conta nao funciona.`
}

function normalizeSmtpError(profile, error) {
  const message = error instanceof Error ? error.message : 'Falha desconhecida no SMTP'

  if (
    isGmailProfile(profile) &&
    /Invalid login|Username and Password not accepted|Application-specific password required|BadCredentials|534-5\.7\.9|535-5\.7\.8/i.test(message)
  ) {
    return `Falha na autenticacao SMTP do Gmail. ${getGmailSetupHint(profile)}`
  }

  return message
}

function ensureSmtpConfig(profile) {
  const missing = ['HOST', 'USER'].filter((key) => !getProfileEnv(profile, key))

  const hasPasswordAuth = Boolean(getProfileEnv(profile, 'PASS'))
  const hasOAuthConfig = Boolean(
    getProfileEnv(profile, 'OAUTH_CLIENT_ID') &&
      getProfileEnv(profile, 'OAUTH_CLIENT_SECRET') &&
      (getProfileEnv(profile, 'OAUTH_REFRESH_TOKEN') || getProfileEnv(profile, 'OAUTH_ACCESS_TOKEN'))
  )

  if (missing.length > 0) {
    throw new Error(`Variáveis ausentes para ${profile}: ${missing.join(', ')}`)
  }

  if (!hasPasswordAuth && !hasOAuthConfig) {
    if (isGmailProfile(profile)) {
      throw new Error(`Configuracao incompleta do Gmail para ${profile}. ${getGmailSetupHint(profile)}`)
    }

    throw new Error(`Configure ${profile} com PASS ou variáveis OAUTH para autenticação SMTP`)
  }
}

function createTransporter(profile) {
  const auth = getProfileEnv(profile, 'OAUTH_CLIENT_ID') && getProfileEnv(profile, 'OAUTH_CLIENT_SECRET') && (getProfileEnv(profile, 'OAUTH_REFRESH_TOKEN') || getProfileEnv(profile, 'OAUTH_ACCESS_TOKEN'))
    ? {
        type: 'OAuth2',
        user: getProfileEnv(profile, 'USER'),
        clientId: getProfileEnv(profile, 'OAUTH_CLIENT_ID'),
        clientSecret: getProfileEnv(profile, 'OAUTH_CLIENT_SECRET'),
        refreshToken: getProfileEnv(profile, 'OAUTH_REFRESH_TOKEN'),
        accessToken: getProfileEnv(profile, 'OAUTH_ACCESS_TOKEN'),
      }
    : {
        user: getProfileEnv(profile, 'USER'),
        pass: getProfileEnv(profile, 'PASS'),
      }

  return nodemailer.createTransport({
    service: isGmailProfile(profile) ? 'gmail' : undefined,
    host: getProfileEnv(profile, 'HOST'),
    port: Number(getProfileEnv(profile, 'PORT') || 587),
    secure: Number(getProfileEnv(profile, 'PORT') || 587) === 465,
    requireTLS: Number(getProfileEnv(profile, 'PORT') || 587) !== 465,
    tls: {
      servername: getProfileEnv(profile, 'HOST'),
    },
    auth,
  })
}

async function run() {
  const options = parseArgs(process.argv.slice(2))
  ensureSmtpConfig(options.profile)

  const transporter = createTransporter(options.profile)
  await transporter.verify()
  console.log(`SMTP ${options.profile} verificado com sucesso.`)

  if (options.verifyOnly) {
    return
  }

  if (!options.sendTo) {
    throw new Error('Informe um destinatário com --send email@dominio.com ou use --verify-only')
  }

  const info = await transporter.sendMail({
    from: getProfileEnv(options.profile, 'FROM') || getProfileEnv(options.profile, 'USER'),
    to: options.sendTo,
    subject:
      options.profile === 'security-alert'
        ? '[Teste] Alerta de segurança - Clínica Zucato'
        : 'Recuperação de senha - Clínica Zucato (teste)',
    text:
      options.profile === 'security-alert'
        ? 'Teste de envio do fluxo de alertas de segurança.'
        : `Teste de envio do fluxo de recuperação. Link de exemplo: ${options.link}`,
    html:
      options.profile === 'security-alert'
        ? `
      <h2>Teste de alerta de segurança</h2>
      <p>Este email foi enviado pelo script de validação SMTP do perfil de alertas.</p>
    `
        : `
      <p>Teste de envio do fluxo de recuperação.</p>
      <p><a href="${options.link}">Clique aqui para abrir o link de exemplo</a></p>
      <p>Este email foi enviado pelo script de validação SMTP.</p>
    `,
  })

  console.log(`Email de teste (${options.profile}) enviado com sucesso. Message ID: ${info.messageId}`)
}

run().catch((error) => {
  console.error('Falha ao validar SMTP:', normalizeSmtpError(parseArgs(process.argv.slice(2)).profile, error))
  process.exit(1)
})