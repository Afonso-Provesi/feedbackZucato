import nodemailer from 'nodemailer'

export interface TwoFactorDeliveryResult {
  delivery: 'smtp' | 'dev-fallback'
  developmentCode?: string
}

export interface RecoveryEmailDeliveryResult {
  delivery: 'smtp' | 'dev-fallback'
}

export interface EmailTransportVerificationResult {
  delivery: 'smtp' | 'dev-fallback'
  verified: boolean
}

export interface SecurityAlertPayload {
  eventType: 'failed-login' | 'failed-mfa' | 'password-recovery-abuse'
  attemptedEmail?: string | null
  ip: string
  userAgent?: string | null
  requestPath?: string | null
  reason?: string | null
  attempts: number
  windowMinutes: number
  provider: 'memory' | 'upstash'
}

export interface SecurityAlertDeliveryResult {
  delivery: 'smtp' | 'dev-fallback'
  recipients: string[]
}

type EmailProfile = 'auth' | 'security-alert'

interface EmailProfileConfig {
  service?: 'gmail'
  host: string
  port: number
  secure: boolean
  user: string
  from: string
  auth: {
    user: string
    pass?: string
    type?: 'OAuth2'
    clientId?: string
    clientSecret?: string
    refreshToken?: string
    accessToken?: string
  }
}

const transporters = new Map<EmailProfile, ReturnType<typeof nodemailer.createTransport>>()

function getEnvValue(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim()

    if (value) {
      return value
    }
  }

  return undefined
}

function getProfileEnvKeys(profile: EmailProfile, key: string): string[] {
  if (profile === 'security-alert') {
    return [`SECURITY_ALERT_SMTP_${key}`, `RECOVERY_SMTP_${key}`, `SMTP_${key}`]
  }

  return [`RECOVERY_SMTP_${key}`, `SMTP_${key}`]
}

function isDevFallbackEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_2FA_FALLBACK === 'true'
}

function useDevelopmentFallback(email: string, code: string, reason: string): TwoFactorDeliveryResult {
  console.warn(`[2FA][DEV_FALLBACK] ${reason} | email=${email} | code=${code}`)

  return {
    delivery: 'dev-fallback',
    developmentCode: code,
  }
}

function useRecoveryDevelopmentFallback(email: string, actionLink: string, reason: string): RecoveryEmailDeliveryResult {
  console.warn(`[RECOVERY][DEV_FALLBACK] ${reason} | email=${email} | link=${actionLink}`)

  return {
    delivery: 'dev-fallback',
  }
}

function useSecurityAlertDevelopmentFallback(
  payload: SecurityAlertPayload,
  recipients: string[],
  reason: string
): SecurityAlertDeliveryResult {
  console.warn(
    `[SECURITY_ALERT][DEV_FALLBACK] ${reason} | recipients=${recipients.join(',')} | event=${payload.eventType} | ip=${payload.ip} | email=${payload.attemptedEmail || 'n/a'} | attempts=${payload.attempts}`
  )

  return {
    delivery: 'dev-fallback',
    recipients,
  }
}

function getSecurityAlertRecipients(): string[] {
  const configured = process.env.SECURITY_ALERT_EMAILS || process.env.SECURITY_ALERT_EMAIL

  if (configured) {
    return configured
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const fallback =
    process.env.SECURITY_ALERT_SMTP_FROM ||
    process.env.SECURITY_ALERT_SMTP_USER ||
    process.env.RECOVERY_SMTP_FROM ||
    process.env.RECOVERY_SMTP_USER ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER

  return fallback ? [fallback] : []
}

function getSecurityEventLabel(eventType: SecurityAlertPayload['eventType']): string {
  switch (eventType) {
    case 'failed-login':
      return 'Falhas de login'
    case 'failed-mfa':
      return 'Falhas de MFA'
    case 'password-recovery-abuse':
      return 'Abuso na recuperação de senha'
    default:
      return 'Evento suspeito'
  }
}

function getProfileEnv(profile: EmailProfile, key: string): string | undefined {
  return getEnvValue(getProfileEnvKeys(profile, key))
}

function isGmailProfile(profile: EmailProfile): boolean {
  const host = getProfileEnv(profile, 'HOST')?.toLowerCase()
  const user = getProfileEnv(profile, 'USER')?.toLowerCase()

  return Boolean(
    host === 'smtp.gmail.com' ||
      host === 'smtp.googlemail.com' ||
      user?.endsWith('@gmail.com') ||
      user?.endsWith('@googlemail.com')
  )
}

function getGmailSetupHint(profile: EmailProfile): string {
  const prefix = profile === 'auth' ? 'RECOVERY_SMTP' : 'SECURITY_ALERT_SMTP'

  return `Para Gmail, configure ${prefix}_USER com a conta Gmail e ${prefix}_PASS com uma senha de app de 16 caracteres do Google. A senha normal da conta nao funciona.`
}

function getMissingSmtpConfigError(profile: EmailProfile, purpose: string): Error {
  if (isGmailProfile(profile)) {
    return new Error(`Configuracao incompleta do Gmail para ${purpose}. ${getGmailSetupHint(profile)}`)
  }

  return new Error(`SMTP nao configurado para ${purpose}`)
}

function normalizeSmtpError(profile: EmailProfile, error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error('Falha desconhecida no SMTP')
  }

  if (!isGmailProfile(profile)) {
    return error
  }

  if (
    /Invalid login|Username and Password not accepted|Application-specific password required|BadCredentials|534-5\.7\.9|535-5\.7\.8/i.test(
      error.message
    )
  ) {
    return new Error(`Falha na autenticacao SMTP do Gmail. ${getGmailSetupHint(profile)}`)
  }

  return error
}

function hasOAuthConfig(profile: EmailProfile): boolean {
  return Boolean(
    getProfileEnv(profile, 'OAUTH_CLIENT_ID') &&
      getProfileEnv(profile, 'OAUTH_CLIENT_SECRET') &&
      (getProfileEnv(profile, 'OAUTH_REFRESH_TOKEN') || getProfileEnv(profile, 'OAUTH_ACCESS_TOKEN'))
  )
}

function getSmtpConfig(profile: EmailProfile): EmailProfileConfig | null {
  const host = getProfileEnv(profile, 'HOST')?.trim()
  const user = getProfileEnv(profile, 'USER')?.trim()
  const port = Number(getProfileEnv(profile, 'PORT') || 587)
  const isGmail = isGmailProfile(profile)

  if (!host || !user) {
    return null
  }

  if (hasOAuthConfig(profile)) {
    return {
      service: isGmail ? 'gmail' : undefined,
      host,
      port,
      secure: port === 465,
      user,
      from: getProfileEnv(profile, 'FROM') || user,
      auth: {
        type: 'OAuth2',
        user,
        clientId: getProfileEnv(profile, 'OAUTH_CLIENT_ID'),
        clientSecret: getProfileEnv(profile, 'OAUTH_CLIENT_SECRET'),
        refreshToken: getProfileEnv(profile, 'OAUTH_REFRESH_TOKEN'),
        accessToken: getProfileEnv(profile, 'OAUTH_ACCESS_TOKEN'),
      },
    }
  }

  const pass = getProfileEnv(profile, 'PASS')

  if (!pass) {
    return null
  }

  return {
    service: isGmail ? 'gmail' : undefined,
    host,
    port,
    secure: port === 465,
    user,
    from: getProfileEnv(profile, 'FROM') || user,
    auth: {
      user,
      pass,
    },
  }
}

function getSmtpTransporter(profile: EmailProfile) {
  const existingTransporter = transporters.get(profile)

  if (existingTransporter) {
    return existingTransporter
  }

  const config = getSmtpConfig(profile)

  if (!config) {
    return null
  }

  const transporter = nodemailer.createTransport({
    service: config.service,
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    tls: {
      servername: config.host,
    },
    auth: config.auth,
  })

  transporters.set(profile, transporter)

  return transporter
}

export async function verifyEmailTransport(): Promise<EmailTransportVerificationResult> {
  const smtpTransporter = getSmtpTransporter('auth')

  if (!smtpTransporter) {
    if (isDevFallbackEnabled()) {
      return {
        delivery: 'dev-fallback',
        verified: true,
      }
    }

    throw getMissingSmtpConfigError('auth', 'envio de emails administrativos')
  }

  try {
    await smtpTransporter.verify()
  } catch (error) {
    throw normalizeSmtpError('auth', error)
  }

  return {
    delivery: 'smtp',
    verified: true,
  }
}

export async function send2FACode(email: string, code: string): Promise<TwoFactorDeliveryResult> {
  const smtpTransporter = getSmtpTransporter('auth')

  if (!smtpTransporter) {
    if (isDevFallbackEnabled()) {
      return useDevelopmentFallback(email, code, getMissingSmtpConfigError('auth', 'envio do 2FA').message)
    }

    throw getMissingSmtpConfigError('auth', 'envio do 2FA')
  }

  const config = getSmtpConfig('auth')!

  try {
    await smtpTransporter.sendMail({
      from: config.from,
      to: email,
      subject: 'Seu código de verificação (2FA)',
      text: `Seu código de verificação é: ${code}`,
      html: `<p>Seu código de verificação é: <b>${code}</b></p>`,
    })

    return { delivery: 'smtp' }
  } catch (error) {
    const normalizedError = normalizeSmtpError('auth', error)

    if (isDevFallbackEnabled()) {
      return useDevelopmentFallback(email, code, normalizedError.message)
    }

    throw normalizedError
  }
}

export async function sendPasswordRecoveryLink(
  email: string,
  actionLink: string
): Promise<RecoveryEmailDeliveryResult> {
  const smtpTransporter = getSmtpTransporter('auth')

  if (!smtpTransporter) {
    if (isDevFallbackEnabled()) {
      return useRecoveryDevelopmentFallback(
        email,
        actionLink,
        getMissingSmtpConfigError('auth', 'envio de recuperacao de senha').message
      )
    }

    throw getMissingSmtpConfigError('auth', 'envio de recuperacao de senha')
  }

  const config = getSmtpConfig('auth')!

  try {
    await smtpTransporter.sendMail({
      from: config.from,
      to: email,
      subject: 'Recuperação de senha - Clínica Zucato',
      text: `Recebemos uma solicitação para redefinir sua senha administrativa. Use este link para continuar: ${actionLink}`,
      html: `
        <p>Recebemos uma solicitação para redefinir sua senha administrativa.</p>
        <p><a href="${actionLink}">Clique aqui para redefinir sua senha</a></p>
        <p>Se você não solicitou a alteração, ignore este email.</p>
      `,
    })

    return { delivery: 'smtp' }
  } catch (error) {
    const normalizedError = normalizeSmtpError('auth', error)

    if (isDevFallbackEnabled()) {
      return useRecoveryDevelopmentFallback(email, actionLink, normalizedError.message)
    }

    throw normalizedError
  }
}

export async function sendSecurityAlertEmail(
  payload: SecurityAlertPayload
): Promise<SecurityAlertDeliveryResult> {
  const recipients = getSecurityAlertRecipients()
  const smtpTransporter = getSmtpTransporter('security-alert')

  if (recipients.length === 0) {
    throw new Error('Nenhum destinatario configurado para alertas de seguranca')
  }

  if (!smtpTransporter) {
    if (isDevFallbackEnabled()) {
      return useSecurityAlertDevelopmentFallback(
        payload,
        recipients,
        getMissingSmtpConfigError('security-alert', 'envio de alertas de seguranca').message
      )
    }

    throw getMissingSmtpConfigError('security-alert', 'envio de alertas de seguranca')
  }

  const config = getSmtpConfig('security-alert')!
  const eventLabel = getSecurityEventLabel(payload.eventType)
  const attemptedEmail = payload.attemptedEmail || 'não informado'
  const reason = payload.reason || 'não informado'
  const requestPath = payload.requestPath || '/autumn/login'
  const userAgent = payload.userAgent || 'não informado'

  try {
    await smtpTransporter.sendMail({
      from: config.from,
      to: recipients.join(', '),
      subject: `[Alerta] ${eventLabel} no painel administrativo`,
      text: [
        `Evento: ${eventLabel}`,
        `Tentativas detectadas: ${payload.attempts} em ${payload.windowMinutes} minuto(s)`,
        `Email alvo: ${attemptedEmail}`,
        `IP: ${payload.ip}`,
        `Rota: ${requestPath}`,
        `Motivo: ${reason}`,
        `Provider rate limit: ${payload.provider}`,
        `User-Agent: ${userAgent}`,
      ].join('\n'),
      html: `
        <h2>Alerta de seguranca no painel administrativo</h2>
        <p><strong>Evento:</strong> ${eventLabel}</p>
        <p><strong>Tentativas detectadas:</strong> ${payload.attempts} em ${payload.windowMinutes} minuto(s)</p>
        <p><strong>Email alvo:</strong> ${attemptedEmail}</p>
        <p><strong>IP:</strong> ${payload.ip}</p>
        <p><strong>Rota:</strong> ${requestPath}</p>
        <p><strong>Motivo:</strong> ${reason}</p>
        <p><strong>Provider rate limit:</strong> ${payload.provider}</p>
        <p><strong>User-Agent:</strong> ${userAgent}</p>
      `,
    })

    return {
      delivery: 'smtp',
      recipients,
    }
  } catch (error) {
    const normalizedError = normalizeSmtpError('security-alert', error)

    if (isDevFallbackEnabled()) {
      return useSecurityAlertDevelopmentFallback(payload, recipients, normalizedError.message)
    }

    throw normalizedError
  }
}

export function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
