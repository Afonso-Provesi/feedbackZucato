import { hashEmail } from '@/lib/crypto'
import { validateEmail } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabase'

export interface ManagedAdminRecord {
  id: string
  email: string
  auth_user_id: string | null
  invited_by_email: string | null
  created_at: string
  is_active: boolean
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function formatProtectedAdminEmail(): string {
  return 'email protegido por hash'
}

export async function listManagedAdmins(): Promise<ManagedAdminRecord[]> {
  const { data, error } = await supabaseAdmin
    .from('admins')
    .select('id, email, auth_user_id, invited_by_email, created_at, is_active')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export async function findManagedAdminByEmail(email: string): Promise<ManagedAdminRecord | null> {
  const normalizedEmail = normalizeEmail(email)
  const emailHash = hashEmail(normalizedEmail)

  const { data, error } = await supabaseAdmin
    .from('admins')
    .select('id, email, auth_user_id, invited_by_email, created_at, is_active')
    .eq('email', emailHash)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data || null
}

export async function updateManagedAdminStatus(adminId: string, isActive: boolean) {
  const { data, error } = await supabaseAdmin
    .from('admins')
    .update({ is_active: isActive })
    .eq('id', adminId)
    .select('id, email, auth_user_id, invited_by_email, created_at, is_active')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function upsertManagedAdmin(params: {
  email: string
  authUserId: string | null
  invitedByEmailHash: string
  isActive?: boolean
}) {
  const normalizedEmail = normalizeEmail(params.email)

  if (!validateEmail(normalizedEmail)) {
    throw new Error('Email inválido')
  }

  const { data, error } = await supabaseAdmin
    .from('admins')
    .upsert(
      {
        email: hashEmail(normalizedEmail),
        auth_user_id: params.authUserId,
        invited_by_email: params.invitedByEmailHash,
        password_hash: 'SUPABASE_AUTH_MANAGED',
        is_active: params.isActive ?? true,
      },
      {
        onConflict: 'email',
      }
    )
    .select('id, email, auth_user_id, invited_by_email, created_at, is_active')
    .single()

  if (error) {
    throw error
  }

  return data
}