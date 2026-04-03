import { NextRequest, NextResponse } from 'next/server'
import {
  findManagedAdminByEmail,
  formatProtectedAdminEmail,
  getManagedAdminById,
  listManagedAdmins,
  updateManagedAdminStatus,
  upsertManagedAdmin,
} from '@/lib/adminManagement'
import { validateSupabaseAdminSession } from '@/lib/adminAuth'
import { validateEmail } from '@/lib/security'
import { hashEmail } from '@/lib/crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeEmailInput, sanitizeTextField } from '@/lib/inputProtection'

function randomPassword(): string {
  return `Tmp-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

function requireOwner(session: Awaited<ReturnType<typeof validateSupabaseAdminSession>>) {
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!session.canManageAdmins) {
    return NextResponse.json({ error: 'Apenas o admin proprietário pode gerenciar administradores' }, { status: 403 })
  }

  return null
}

function getRecoveryRedirectUrl(req: NextRequest): string {
  return `${req.nextUrl.origin}/autumn/login?mode=recovery`
}

async function findAuthUserByEmail(email: string) {
  const adminApi = supabaseAdmin.auth.admin
  let page = 1

  while (true) {
    const { data, error } = await adminApi.listUsers({ page, perPage: 200 })

    if (error) {
      throw error
    }

    const found = data.users.find((user) => user.email?.toLowerCase() === email)
    if (found) {
      return found
    }

    if (data.users.length < 200) {
      return null
    }

    page += 1
  }
}

async function findAuthEmailByUserId(authUserId: string | null) {
  if (!authUserId) {
    return null
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(authUserId)

  if (error) {
    if (error.message.toLowerCase().includes('not found')) {
      return null
    }

    throw error
  }

  return data.user?.email?.toLowerCase() || null
}

async function getAuthEmailsByUserIds(authUserIds: Array<string | null>) {
  const uniqueUserIds = Array.from(new Set(authUserIds.filter((authUserId): authUserId is string => Boolean(authUserId))))
  const usersById = new Map<string, string>()

  await Promise.all(
    uniqueUserIds.map(async (authUserId) => {
      try {
        const authEmail = await findAuthEmailByUserId(authUserId)
        if (authEmail) {
          usersById.set(authUserId, authEmail)
        }
      } catch (error) {
        console.error(`Erro ao resolver email do usuário ${authUserId}:`, error)
      }
    })
  )

  return usersById
}

async function createOrLoadAuthUser(email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password: randomPassword(),
    email_confirm: true,
  })

  if (error) {
    const message = error.message.toLowerCase()

    if (message.includes('already') || message.includes('registered') || message.includes('exists')) {
      const duplicatedUser = await findAuthUserByEmail(normalizedEmail)
      if (duplicatedUser) {
        return {
          user: duplicatedUser,
          reused: true,
        }
      }
    }

    throw error
  }

  if (!data.user) {
    throw new Error('Não foi possível criar o usuário no Supabase Auth')
  }

  return {
    user: data.user,
    reused: false,
  }
}

async function generatePasswordSetupLink(email: string, redirectTo: string) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo,
    },
  })

  if (error) {
    throw error
  }

  return data.properties.action_link
}

export async function GET() {
  try {
    const session = await validateSupabaseAdminSession()
    const deniedResponse = requireOwner(session)
    if (deniedResponse) {
      return deniedResponse
    }

    const admins = await listManagedAdmins()
    const usersById = await getAuthEmailsByUserIds(admins.map((admin) => admin.auth_user_id))

    return NextResponse.json(
      {
        currentAdmin: {
          id: session!.adminId,
          email: session!.email,
          role: session!.role,
          canManageAdmins: session!.canManageAdmins,
        },
        admins: admins.map((admin) => ({
          ...admin,
          display_email: admin.auth_user_id ? usersById.get(admin.auth_user_id) || formatProtectedAdminEmail() : formatProtectedAdminEmail(),
          is_legacy_only: !admin.auth_user_id,
          invited_by_email: admin.invited_by_email ? `hash:${admin.invited_by_email.slice(0, 10)}...` : null,
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao listar admins:', error)
    return NextResponse.json({ error: 'Erro ao listar administradores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await validateSupabaseAdminSession()
    const deniedResponse = requireOwner(session)
    if (deniedResponse) {
      return deniedResponse
    }

    const ownerSession = session!

    const body = await req.json()
    const email = normalizeEmailInput(body.email)

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const existingAdmin = await findManagedAdminByEmail(email)
    const authUserResult = await createOrLoadAuthUser(email)
    const adminRecord = await upsertManagedAdmin({
      email,
      authUserId: authUserResult.user.id,
      invitedByEmailHash: hashEmail(ownerSession.email),
      isActive: true,
    })
    const setupLink = await generatePasswordSetupLink(email, getRecoveryRedirectUrl(req))

    return NextResponse.json(
      {
        success: true,
        admin: {
          ...adminRecord,
          display_email: authUserResult.user.email || formatProtectedAdminEmail(),
          is_legacy_only: !adminRecord.auth_user_id,
          invited_by_email: adminRecord.invited_by_email ? `hash:${adminRecord.invited_by_email.slice(0, 10)}...` : null,
        },
        setupLink,
        reusedExistingAuthUser: authUserResult.reused,
        message: existingAdmin
          ? 'Admin atualizado e link de acesso gerado.'
          : authUserResult.reused
            ? 'Conta existente no Auth reaproveitada e link de acesso gerado.'
            : 'Admin cadastrado e link de acesso gerado.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao cadastrar admin:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao cadastrar administrador' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await validateSupabaseAdminSession()
    const deniedResponse = requireOwner(session)
    if (deniedResponse) {
      return deniedResponse
    }

    const body = await req.json()
    const action = sanitizeTextField(body.action, { maxLength: 32 })

    if (action === 'toggle-status') {
      const adminId = sanitizeTextField(body.adminId, { maxLength: 64 })
      const isActive = Boolean(body.isActive)

      if (!adminId) {
        return NextResponse.json({ error: 'Admin inválido' }, { status: 400 })
      }

      const existingAdmin = await getManagedAdminById(adminId)
      if (!existingAdmin) {
        return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
      }

      if (existingAdmin.role === 'owner' && !isActive) {
        return NextResponse.json({ error: 'O admin proprietário não pode ser desativado' }, { status: 400 })
      }

      const admin = await updateManagedAdminStatus(adminId, isActive)
      const authEmail = await findAuthEmailByUserId(admin.auth_user_id)
      return NextResponse.json({
        success: true,
        admin: {
          ...admin,
          display_email: authEmail || formatProtectedAdminEmail(),
          is_legacy_only: !admin.auth_user_id,
          invited_by_email: admin.invited_by_email ? `hash:${admin.invited_by_email.slice(0, 10)}...` : null,
        },
      })
    }

    if (action === 'generate-setup-link') {
      const adminId = sanitizeTextField(body.adminId, { maxLength: 64 })

      if (!adminId) {
        return NextResponse.json({ error: 'Admin inválido' }, { status: 400 })
      }

      const admin = await getManagedAdminById(adminId)

      if (!admin?.auth_user_id) {
        return NextResponse.json({ error: 'Registro legado sem vínculo com Supabase Auth' }, { status: 400 })
      }

      const authEmail = await findAuthEmailByUserId(admin.auth_user_id)
      if (!authEmail || !validateEmail(authEmail)) {
        return NextResponse.json({ error: 'Não foi possível localizar o email do usuário no Supabase Auth' }, { status: 400 })
      }

      const setupLink = await generatePasswordSetupLink(authEmail, getRecoveryRedirectUrl(req))
      return NextResponse.json({ success: true, setupLink })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao atualizar admin:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar administrador' },
      { status: 500 }
    )
  }
}