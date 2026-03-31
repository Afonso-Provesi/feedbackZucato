'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface ManagedAdmin {
  id: string
  display_email: string
  invited_by_email: string | null
  auth_user_id: string | null
  created_at: string
  is_active: boolean
  is_legacy_only: boolean
  role: 'owner' | 'admin'
}

interface CurrentAdmin {
  id: string
  email: string
  role: 'owner' | 'admin'
  canManageAdmins: boolean
}

export default function AdminAccountsPanel() {
  const [admins, setAdmins] = useState<ManagedAdmin[]>([])
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [latestSetupLink, setLatestSetupLink] = useState('')
  const [permissionError, setPermissionError] = useState('')

  const loadAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar admins')
      }

      setPermissionError('')
      setAdmins(data.admins || [])
      setCurrentAdmin(data.currentAdmin || null)
    } catch (error) {
      console.error('Erro ao carregar admins:', error)
      setPermissionError(error instanceof Error ? error.message : 'Erro ao carregar admins')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentAdmin?.canManageAdmins) {
      toast.error('Apenas o admin proprietário pode cadastrar administradores')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar admin')
      }

      setEmail('')
      setLatestSetupLink(data.setupLink || '')
      toast.success(data.message || 'Admin cadastrado com sucesso')
      await loadAdmins()
    } catch (error) {
      console.error('Erro ao cadastrar admin:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar admin')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (admin: ManagedAdmin) => {
    if (!currentAdmin?.canManageAdmins) {
      toast.error('Apenas o admin proprietário pode alterar o status de administradores')
      return
    }

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle-status',
          adminId: admin.id,
          isActive: !admin.is_active,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar admin')
      }

      setAdmins((current) =>
        current.map((item) => (item.id === admin.id ? { ...item, is_active: !admin.is_active } : item))
      )
      toast.success(!admin.is_active ? 'Admin ativado' : 'Admin desativado')
    } catch (error) {
      console.error('Erro ao atualizar admin:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar admin')
    }
  }

  const handleGenerateLink = async (admin: ManagedAdmin) => {
    if (!currentAdmin?.canManageAdmins) {
      toast.error('Apenas o admin proprietário pode gerar links de acesso')
      return
    }

    if (!admin.auth_user_id) {
      toast.error('Este registro legado não possui email visível para gerar link')
      return
    }

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-setup-link',
          adminId: admin.id,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar link')
      }

      setLatestSetupLink(data.setupLink || '')
      toast.success('Novo link gerado com sucesso')
    } catch (error) {
      console.error('Erro ao gerar link:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar link')
    }
  }

  return (
    <section className="rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.84)] p-6 shadow-[0_20px_44px_rgba(21,58,91,0.08)] mb-8">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Governança</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--color-primary)]">Contas Administrativas</h3>
          <p className="text-sm text-[var(--text-soft)] mt-1">
            Cadastre emails permitidos, gere links de definição de senha e ative ou desative contas. A tabela admins guarda apenas o hash SHA-256 do email.
          </p>
          {currentAdmin && (
            <p className="mt-3 inline-flex rounded-full bg-[rgba(21,58,91,0.08)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              Seu papel: {currentAdmin.role === 'owner' ? 'Proprietário' : 'Admin padrão'}
            </p>
          )}
        </div>
      </div>

      {permissionError && !admins.length ? (
        <div className="mb-6 rounded-[24px] border border-[rgba(21,58,91,0.12)] bg-[rgba(21,58,91,0.04)] p-4 text-sm text-[var(--text-soft)]">
          {permissionError}
        </div>
      ) : null}

      <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 mb-6">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="novo-admin@dominio.com"
          className="px-4 py-3 border border-[rgba(21,58,91,0.12)] rounded-2xl bg-[rgba(255,250,243,0.8)] focus:outline-none focus:ring-4 focus:ring-[rgba(181,138,87,0.12)]"
          required
          disabled={!currentAdmin?.canManageAdmins}
        />
        <button
          type="submit"
          disabled={isSubmitting || !currentAdmin?.canManageAdmins}
          className="px-5 py-3 rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),#245783)] text-white font-semibold shadow-[0_14px_28px_rgba(21,58,91,0.18)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar admin'}
        </button>
      </form>

      {!currentAdmin?.canManageAdmins && !permissionError && (
        <div className="mb-6 rounded-[24px] border border-[rgba(181,138,87,0.24)] bg-[rgba(255,248,238,0.92)] p-4 text-sm text-[var(--text-soft)]">
          Apenas o admin proprietário pode cadastrar, ativar, desativar e gerar links para administradores.
        </div>
      )}

      {latestSetupLink && (
        <div className="mb-6 rounded-[24px] border border-[rgba(181,138,87,0.28)] bg-[rgba(255,248,238,0.96)] p-4">
          <p className="text-sm font-semibold text-[var(--color-primary)] mb-2">Link mais recente para definição de senha</p>
          <textarea
            readOnly
            value={latestSetupLink}
            className="w-full min-h-[96px] rounded-2xl border border-[rgba(181,138,87,0.24)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
          />
          <div className="mt-3 flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(latestSetupLink)
                toast.success('Link copiado')
              }}
              className="px-4 py-2 rounded-2xl bg-[var(--color-secondary)] text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              Copiar link
            </button>
            <p className="text-xs text-[var(--text-soft)] self-center">
              Envie este link ao admin para que ele defina a senha da conta com segurança.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-[var(--text-soft)]">Carregando administradores...</p>
      ) : admins.length === 0 ? (
        <p className="text-sm text-[var(--text-soft)]">Nenhum administrador cadastrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[rgba(21,58,91,0.08)] text-left text-[var(--text-soft)]">
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Papel</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Origem</th>
                <th className="py-3 pr-4">Criado em</th>
                <th className="py-3 pr-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-[rgba(21,58,91,0.06)] align-top">
                  <td className="py-4 pr-4">
                    <div className="font-medium text-[var(--color-text)]">{admin.display_email}</div>
                    {admin.is_legacy_only && (
                      <div className="text-xs text-amber-700 mt-1">Registro legado sem vínculo completo com Supabase Auth</div>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${admin.role === 'owner' ? 'bg-amber-100 text-amber-800' : 'bg-[rgba(21,58,91,0.08)] text-[var(--color-primary)]'}`}>
                      {admin.role === 'owner' ? 'Proprietário' : 'Admin'}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${admin.is_active ? 'bg-green-100 text-green-700' : 'bg-[rgba(21,58,91,0.08)] text-[var(--text-soft)]'}`}>
                      {admin.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-[var(--text-soft)]">{admin.invited_by_email || 'hash não disponível / legado'}</td>
                  <td className="py-4 pr-4 text-[var(--text-soft)]">{new Date(admin.created_at).toLocaleString('pt-BR')}</td>
                  <td className="py-4 pr-4">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(admin)}
                        disabled={!currentAdmin?.canManageAdmins || admin.role === 'owner'}
                        className={`px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${admin.is_active ? 'bg-[rgba(21,58,91,0.08)] text-[var(--text-soft)] hover:bg-[rgba(21,58,91,0.12)]' : 'bg-green-100 text-green-700 hover:bg-green-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {admin.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateLink(admin)}
                        disabled={!admin.auth_user_id || !currentAdmin?.canManageAdmins}
                        className="px-3 py-2 rounded-2xl text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Gerar link
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}