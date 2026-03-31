import { createHash } from 'crypto'
import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { validateSupabaseAdminSession } from '@/lib/adminAuth'

// Legado: este arquivo ainda preserva helpers da autenticação manual anterior
// para documentação histórica e eventual comparação de abordagem.
// A autenticação ativa do painel agora depende de Supabase Auth SSR.

const rawSecret = process.env.ADMIN_SECRET || 'your-secret-key-change-in-production'
const secret = new TextEncoder().encode(rawSecret)

const AUTH_COOKIE = 'admin_token'
const TRUSTED_COOKIE = 'admin_trusted'
const CHALLENGE_COOKIE = 'admin_2fa_challenge'

export interface AdminPayload {
  id: string
  email: string
  iat: number
  exp: number
}

export interface TrustedAdminPayload {
  adminId: string
  ipHash: string
  type: 'trusted-admin'
  iat: number
  exp: number
}

export interface TwoFactorChallengePayload {
  adminId: string
  email: string
  ipHash: string
  codeHash: string
  type: 'admin-2fa'
  iat: number
  exp: number
}

function hashWithSecret(value: string): string {
  return createHash('sha256').update(`${value}:${rawSecret}`).digest('hex')
}

async function signToken(payload: Record<string, string>, expiresIn: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)
}

export async function createToken(payload: Omit<AdminPayload, 'iat' | 'exp'>): Promise<string> {
  return signToken(payload, '24h')
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const verified = await jwtVerify(token, secret)
    return verified.payload as unknown as AdminPayload
  } catch (err) {
    return null
  }
}

export function hashVerificationCode(code: string): string {
  return hashWithSecret(code)
}

// Legado: cookies e tokens abaixo pertencem ao fluxo manual anterior.
export async function createTrustedAdminToken(adminId: string, ipHash: string): Promise<string> {
  return signToken({ adminId, ipHash, type: 'trusted-admin' }, '7d')
}

export async function verifyTrustedAdminToken(token: string): Promise<TrustedAdminPayload | null> {
  try {
    const verified = await jwtVerify(token, secret)
    const payload = verified.payload as unknown as TrustedAdminPayload

    if (payload.type !== 'trusted-admin') {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function createTwoFactorChallengeToken(payload: {
  adminId: string
  email: string
  ipHash: string
  code: string
}): Promise<string> {
  return signToken(
    {
      adminId: payload.adminId,
      email: payload.email,
      ipHash: payload.ipHash,
      codeHash: hashVerificationCode(payload.code),
      type: 'admin-2fa',
    },
    '8m'
  )
}

export async function verifyTwoFactorChallengeToken(token: string): Promise<TwoFactorChallengePayload | null> {
  try {
    const verified = await jwtVerify(token, secret)
    const payload = verified.payload as unknown as TwoFactorChallengePayload

    if (payload.type !== 'admin-2fa') {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 86400, // 24 hours
    path: '/',
  })
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE)?.value || null
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE)
}

export async function setTrustedAdminCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(TRUSTED_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
}

export async function getTrustedAdminCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(TRUSTED_COOKIE)?.value || null
}

export async function clearTrustedAdminCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(TRUSTED_COOKIE)
}

export async function setTwoFactorChallengeCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60,
    path: '/',
  })
}

export async function getTwoFactorChallengeCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CHALLENGE_COOKIE)?.value || null
}

export async function clearTwoFactorChallengeCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CHALLENGE_COOKIE)
}

export async function validateAdminSession(): Promise<AdminPayload | null> {
  const session = await validateSupabaseAdminSession()

  if (!session) {
    return null
  }

  return {
    id: session.id,
    email: session.email,
    iat: 0,
    exp: 0,
  }
}
