import { hashEmail } from '@/lib/crypto'
import { validateEmail } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabase'

export const ADMIN_ROLES = ['owner', 'admin'] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]

export interface ManagedAdminRecord {
  id: string
  email: string
  auth_user_id: string | null
  invited_by_email: string | null
  created_at: string
  is_active: boolean
  role: AdminRole
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizeRole(role: string | null | undefined): AdminRole {
  return role === 'owner' ? 'owner' : 'admin'
}

function isMissingRoleColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  if ('code' in error && error.code === '42703') {
    return true
  }

  if ('message' in error && typeof error.message === 'string' && error.message.trim() === '') {
    return true
  }

  const combinedText = [
    'message' in error && typeof error.message === 'string' ? error.message : '',
    'details' in error && typeof error.details === 'string' ? error.details : '',
    'hint' in error && typeof error.hint === 'string' ? error.hint : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return combinedText.includes('role') && (combinedText.includes('column') || combinedText.includes('schema cache'))
}

type AdminRow = {
  id: string
  email: string
  auth_user_id: string | null
  invited_by_email: string | null
  created_at: string
  is_active: boolean
  role?: string | null
}

function mapAdminRecord(admin: AdminRow): ManagedAdminRecord {
  return {
    ...admin,
    role: normalizeRole(admin.role),
  }
}

async function selectAdmins<T>(withRole: () => Promise<T>, withoutRole: () => Promise<T>): Promise<T> {
  try {
    return await withRole()
  } catch (error) {
    if (!isMissingRoleColumn(error)) {
      throw error
    }

    return withoutRole()
  }
}

export function formatProtectedAdminEmail(): string {
  return 'email protegido por hash'
}

export async function listManagedAdmins(): Promise<ManagedAdminRecord[]> {
  return selectAdmins(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active, role')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return (data || []).map((admin) => mapAdminRecord(admin))
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return (data || []).map((admin) => mapAdminRecord(admin))
    }
  )
}

export async function findManagedAdminByEmail(email: string): Promise<ManagedAdminRecord | null> {
  const normalizedEmail = normalizeEmail(email)
  const emailHash = hashEmail(normalizedEmail)

  return selectAdmins(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active, role')
        .eq('email', emailHash)
        .maybeSingle()

      if (error) {
        throw error
      }

      return data ? mapAdminRecord(data) : null
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active')
        .eq('email', emailHash)
        .maybeSingle()

      if (error) {
        throw error
      }

      return data ? mapAdminRecord(data) : null
    }
  )
}

export async function updateManagedAdminStatus(adminId: string, isActive: boolean) {
  return selectAdmins(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .update({ is_active: isActive })
        .eq('id', adminId)
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active, role')
        .single()

      if (error) {
        throw error
      }

      return mapAdminRecord(data)
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .update({ is_active: isActive })
        .eq('id', adminId)
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active')
        .single()

      if (error) {
        throw error
      }

      return mapAdminRecord(data)
    }
  )
}

export async function assignManagedAdminRole(adminId: string, role: AdminRole) {
  return selectAdmins(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .update({ role })
        .eq('id', adminId)
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active, role')
        .single()

      if (error) {
        throw error
      }

      return mapAdminRecord(data)
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active')
        .eq('id', adminId)
        .single()

      if (error) {
        throw error
      }

      return mapAdminRecord(data)
    }
  )
}

export async function getManagedAdminById(adminId: string): Promise<ManagedAdminRecord | null> {
  return selectAdmins(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active, role')
        .eq('id', adminId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return data ? mapAdminRecord(data) : null
    },
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active')
        .eq('id', adminId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return data ? mapAdminRecord(data) : null
    }
  )
}

export async function getOwnerAdmin(): Promise<ManagedAdminRecord | null> {
  return selectAdmins(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active, role')
        .eq('role', 'owner')
        .maybeSingle()

      if (error) {
        throw error
      }

      return data ? mapAdminRecord(data) : null
    },
    async () => null
  )
}

export async function upsertManagedAdmin(params: {
  email: string
  authUserId: string | null
  invitedByEmailHash: string
  isActive?: boolean
  role?: AdminRole
}) {
  const normalizedEmail = normalizeEmail(params.email)

  if (!validateEmail(normalizedEmail)) {
    throw new Error('Email inválido')
  }

  const existingAdmin = await findManagedAdminByEmail(normalizedEmail)
  const role = params.role ?? existingAdmin?.role ?? 'admin'

  return selectAdmins(
    async () => {
      const { data, error } = await supabaseAdmin
        .from('admins')
        .upsert(
          {
            email: hashEmail(normalizedEmail),
            auth_user_id: params.authUserId,
            invited_by_email: params.invitedByEmailHash,
            password_hash: 'SUPABASE_AUTH_MANAGED',
            is_active: params.isActive ?? true,
            role,
          },
          {
            onConflict: 'email',
          }
        )
        .select('id, email, auth_user_id, invited_by_email, created_at, is_active, role')
        .single()

      if (error) {
        throw error
      }

      return mapAdminRecord(data)
    },
    async () => {
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

      return mapAdminRecord(data)
    }
  )
}