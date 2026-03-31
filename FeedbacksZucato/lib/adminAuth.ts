import { hashEmail } from '@/lib/crypto'
import { assignManagedAdminRole, getOwnerAdmin, type AdminRole } from '@/lib/adminManagement'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-auth/server'

export interface AdminSession {
  id: string
  email: string
  adminId: string
  role: AdminRole
  canManageAdmins: boolean
}

export interface AdminLookupResult {
  id: string
  email: string
  auth_user_id?: string | null
  is_active: boolean
  role: AdminRole
}

const PRIMARY_ADMIN_EMAIL = process.env.PRIMARY_ADMIN_EMAIL?.trim().toLowerCase() || null

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

function mapAdminLookup(data: {
  id: string
  email: string
  auth_user_id?: string | null
  is_active: boolean
  role?: string | null
}): AdminLookupResult {
  return {
    ...data,
    role: data.role === 'owner' ? 'owner' : 'admin',
  }
}

async function findAdminByAuthUserId(authUserId: string): Promise<AdminLookupResult | null> {
  const withRole = await supabaseAdmin
    .from('admins')
    .select('id, email, auth_user_id, is_active, role')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (withRole.error && !isMissingRoleColumn(withRole.error)) {
    throw withRole.error
  }

  if (withRole.data) {
    return mapAdminLookup(withRole.data)
  }

  if (!withRole.error) {
    return null
  }

  const fallback = await supabaseAdmin
    .from('admins')
    .select('id, email, auth_user_id, is_active')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (fallback.error) {
    throw fallback.error
  }

  return fallback.data ? mapAdminLookup(fallback.data) : null
}

export async function findAdminByEmail(email: string): Promise<AdminLookupResult | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const hashedEmail = hashEmail(normalizedEmail)

  const hashedAdmin = await supabaseAdmin
    .from('admins')
    .select('id, email, auth_user_id, is_active, role')
    .eq('email', hashedEmail)
    .maybeSingle()

  if (hashedAdmin.error && !isMissingRoleColumn(hashedAdmin.error)) {
    throw hashedAdmin.error
  }

  if (hashedAdmin.data) {
    return mapAdminLookup(hashedAdmin.data)
  }

  if (hashedAdmin.error) {
    const fallback = await supabaseAdmin
      .from('admins')
      .select('id, email, auth_user_id, is_active')
      .eq('email', hashedEmail)
      .maybeSingle()

    if (fallback.error) {
      throw fallback.error
    }

    if (fallback.data) {
      return mapAdminLookup(fallback.data)
    }
  }

  return null
}

async function ensureOwnerAccess(admin: AdminLookupResult, userEmail: string): Promise<AdminLookupResult> {
  if (admin.role === 'owner') {
    return admin
  }

  const normalizedEmail = userEmail.trim().toLowerCase()

  if (PRIMARY_ADMIN_EMAIL && PRIMARY_ADMIN_EMAIL === normalizedEmail) {
    const promotedAdmin = await assignManagedAdminRole(admin.id, 'owner')
    return {
      ...promotedAdmin,
      role: 'owner',
    }
  }

  const existingOwner = await getOwnerAdmin()
  if (existingOwner) {
    return admin
  }

  const promotedAdmin = await assignManagedAdminRole(admin.id, 'owner')
  return {
    ...promotedAdmin,
    role: 'owner',
  }
}

async function resolveAdminSession(user: { id: string; email?: string | null }): Promise<AdminSession | null> {
  if (!user.email) {
    return null
  }

  const admin = (await findAdminByAuthUserId(user.id)) || (await findAdminByEmail(user.email))

  if (!admin || !admin.is_active) {
    return null
  }

  const resolvedAdmin = await ensureOwnerAccess(admin, user.email)

  return {
    id: user.id,
    email: user.email,
    adminId: resolvedAdmin.id,
    role: resolvedAdmin.role,
    canManageAdmins: resolvedAdmin.role === 'owner',
  }
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

  return resolveAdminSession(user)
}

export async function validateSupabaseAdminAccessToken(accessToken: string): Promise<AdminSession | null> {
  if (!accessToken) {
    return null
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken)

  if (error || !user?.email) {
    return null
  }

  return resolveAdminSession(user)
}