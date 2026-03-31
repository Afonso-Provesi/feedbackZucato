import nodemailer from 'nodemailer'

// Armazenamento temporário em memória (pode ser trocado por Redis ou DB)
const codeStore = new Map<string, { code: string; expires: number }>()

export async function send2FACode(email: string, code: string) {
  // Configure o transporte SMTP (exemplo com Gmail, use variáveis de ambiente)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Seu código de verificação (2FA)',
    text: `Seu código de verificação é: ${code}`,
    html: `<p>Seu código de verificação é: <b>${code}</b></p>`
  })
}

export function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function store2FACode(email: string, code: string) {
  codeStore.set(email, { code, expires: Date.now() + 5 * 60 * 1000 }) // 5 min
}

export function verify2FACode(email: string, code: string): boolean {
  const entry = codeStore.get(email)
  if (!entry) return false
  if (Date.now() > entry.expires) {
    codeStore.delete(email)
    return false
  }
  if (entry.code !== code) return false
  codeStore.delete(email)
  return true
}
