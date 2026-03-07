import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.ADMIN_SECRET || 'your-secret-key-change-in-production')

export interface AdminPayload {
  id: string
  email: string
  iat: number
  exp: number
}

export async function createToken(payload: Omit<AdminPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)

  return token
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const verified = await jwtVerify(token, secret)
    return verified.payload as unknown as AdminPayload
  } catch (err) {
    return null
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 86400, // 24 hours
  })
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_token')?.value || null
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
}

export async function validateAdminSession(): Promise<AdminPayload | null> {
  const token = await getAuthCookie()
  if (!token) return null

  const payload = await verifyToken(token)
  return payload
}
