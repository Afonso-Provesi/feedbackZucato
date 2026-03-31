import { hashEmail } from '@/lib/crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-auth/server'

export interface AdminSession {
  id: string
  email: string
  adminId: string
}

export interface AdminLookupResult {
  id: string
  email: string
  auth_user_id?: string | null
  is_active: boolean
}

async function findAdminByAuthUserId(authUserId: string): Promise<AdminLookupResult | null> {
  const byAuthUserId = await supabaseAdmin
    .from('admins')
    .select('id, email, auth_user_id, is_active')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (byAuthUserId.error) {
    throw byAuthUserId.error
  }

  return byAuthUserId.data
}

export async function findAdminByEmail(email: string): Promise<AdminLookupResult | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const hashedEmail = hashEmail(normalizedEmail)

  const hashedAdmin = await supabaseAdmin
    .from('admins')
    .select('id, email, auth_user_id, is_active')
    .eq('email', hashedEmail)
    .maybeSingle()

  if (hashedAdmin.error) {
    throw hashedAdmin.error
  }

  if (hashedAdmin.data) {
    return hashedAdmin.data
  }

  return null
}

export async function validateSupabaseAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return null
  }

  const admin = (await findAdminByAuthUserId(user.id)) || (await findAdminByEmail(user.email))

  if (!admin || !admin.is_active) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    adminId: admin.id,
  }
}