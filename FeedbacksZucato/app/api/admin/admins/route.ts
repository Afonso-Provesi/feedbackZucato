import { NextRequest, NextResponse } from 'next/server'
import {
  findManagedAdminByEmail,
  formatProtectedAdminEmail,
  listManagedAdmins,
  updateManagedAdminStatus,
  upsertManagedAdmin,
} from '@/lib/adminManagement'
import { validateSupabaseAdminSession } from '@/lib/adminAuth'
import { validateEmail } from '@/lib/security'
import { hashEmail } from '@/lib/crypto'
import { supabaseAdmin } from '@/lib/supabase'

function randomPassword(): string {
  return `Tmp-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
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

async function listAuthUsersById() {
  const adminApi = supabaseAdmin.auth.admin
  const usersById = new Map<string, string>()
  let page = 1

  while (true) {
    const { data, error } = await adminApi.listUsers({ page, perPage: 200 })

    if (error) {
      throw error
    }

    data.users.forEach((user) => {
      if (user.id && user.email) {
        usersById.set(user.id, user.email.toLowerCase())
      }
    })

    if (data.users.length < 200) {
      break
    }

    page += 1
  }

  return usersById
}

async function findAuthEmailByUserId(authUserId: string | null) {
  if (!authUserId) {
    return null
  }

  const usersById = await listAuthUsersById()
  return usersById.get(authUserId) || null
}

async function createOrLoadAuthUser(email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const existingUser = await findAuthUserByEmail(normalizedEmail)
  if (existingUser) {
    return existingUser
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password: randomPassword(),
    email_confirm: true,
  })

  if (error || !data.user) {
    throw error || new Error('Não foi possível criar o usuário no Supabase Auth')
  }

  return data.user
}

async function generatePasswordSetupLink(email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (error) {
    throw error
  }

  return data.properties.action_link
}

export async function GET() {
  try {
    const session = await validateSupabaseAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const admins = await listManagedAdmins()
    const usersById = await listAuthUsersById()

    return NextResponse.json(
      admins.map((admin) => ({
        ...admin,
        display_email: admin.auth_user_id ? usersById.get(admin.auth_user_id) || formatProtectedAdminEmail() : formatProtectedAdminEmail(),
        is_legacy_only: !admin.auth_user_id,
        invited_by_email: admin.invited_by_email ? `hash:${admin.invited_by_email.slice(0, 10)}...` : null,
      })),
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
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const existingAdmin = await findManagedAdminByEmail(email)
    const authUser = await createOrLoadAuthUser(email)
    const adminRecord = await upsertManagedAdmin({
      email,
      authUserId: authUser.id,
      invitedByEmailHash: hashEmail(session.email),
      isActive: true,
    })
    const setupLink = await generatePasswordSetupLink(email)

    return NextResponse.json(
      {
        success: true,
        admin: {
          ...adminRecord,
          display_email: authUser.email || formatProtectedAdminEmail(),
          is_legacy_only: !adminRecord.auth_user_id,
          invited_by_email: adminRecord.invited_by_email ? `hash:${adminRecord.invited_by_email.slice(0, 10)}...` : null,
        },
        setupLink,
        message: existingAdmin ? 'Admin atualizado e link de acesso gerado.' : 'Admin cadastrado e link de acesso gerado.',
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
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const action = body.action

    if (action === 'toggle-status') {
      const adminId = String(body.adminId || '')
      const isActive = Boolean(body.isActive)

      if (!adminId) {
        return NextResponse.json({ error: 'Admin inválido' }, { status: 400 })
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
      const adminId = String(body.adminId || '').trim()

      if (!adminId) {
        return NextResponse.json({ error: 'Admin inválido' }, { status: 400 })
      }

      const admins = await listManagedAdmins()
      const admin = admins.find((item) => item.id === adminId)

      if (!admin?.auth_user_id) {
        return NextResponse.json({ error: 'Registro legado sem vínculo com Supabase Auth' }, { status: 400 })
      }

      const authEmail = await findAuthEmailByUserId(admin.auth_user_id)
      if (!authEmail || !validateEmail(authEmail)) {
        return NextResponse.json({ error: 'Não foi possível localizar o email do usuário no Supabase Auth' }, { status: 400 })
      }

      const setupLink = await generatePasswordSetupLink(authEmail)
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