import nodemailer from 'nodemailer'

export interface TwoFactorDeliveryResult {
  delivery: 'smtp' | 'dev-fallback'
  developmentCode?: string
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

export async function send2FACode(email: string, code: string): Promise<TwoFactorDeliveryResult> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (isDevFallbackEnabled()) {
      return useDevelopmentFallback(email, code, 'SMTP não configurado')
    }

    throw new Error('SMTP não configurado para envio do 2FA')
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Seu código de verificação (2FA)',
      text: `Seu código de verificação é: ${code}`,
      html: `<p>Seu código de verificação é: <b>${code}</b></p>`,
    })

    return { delivery: 'smtp' }
  } catch (error) {
    if (isDevFallbackEnabled()) {
      const message = error instanceof Error ? error.message : 'Falha desconhecida no SMTP'
      return useDevelopmentFallback(email, code, message)
    }

    throw error
  }
}

export function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
