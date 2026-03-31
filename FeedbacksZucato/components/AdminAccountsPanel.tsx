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
}

export default function AdminAccountsPanel() {
  const [admins, setAdmins] = useState<ManagedAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [latestSetupLink, setLatestSetupLink] = useState('')

  const loadAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar admins')
      }

      setAdmins(data)
    } catch (error) {
      console.error('Erro ao carregar admins:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar admins')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <section className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Contas Administrativas</h3>
          <p className="text-sm text-gray-600 mt-1">
            Cadastre emails permitidos, gere links de definição de senha e ative ou desative contas. A tabela `admins` guarda apenas o hash SHA-256 do email.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 mb-6">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="novo-admin@dominio.com"
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-3 bg-brand-blue text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar admin'}
        </button>
      </form>

      {latestSetupLink && (
        <div className="mb-6 rounded-lg border border-brand-gold/30 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">Link mais recente para definição de senha</p>
          <textarea
            readOnly
            value={latestSetupLink}
            className="w-full min-h-[96px] rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700"
          />
          <div className="mt-3 flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(latestSetupLink)
                toast.success('Link copiado')
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-all"
            >
              Copiar link
            </button>
            <p className="text-xs text-amber-900 self-center">
              Envie este link ao admin para que ele defina a senha da conta com segurança.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando administradores...</p>
      ) : admins.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum administrador cadastrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Origem</th>
                <th className="py-3 pr-4">Criado em</th>
                <th className="py-3 pr-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-gray-100 align-top">
                  <td className="py-4 pr-4">
                    <div className="font-medium text-gray-800">{admin.display_email}</div>
                    {admin.is_legacy_only && (
                      <div className="text-xs text-amber-700 mt-1">Registro legado sem vínculo completo com Supabase Auth</div>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${admin.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {admin.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-gray-600">{admin.invited_by_email || 'hash não disponível / legado'}</td>
                  <td className="py-4 pr-4 text-gray-600">{new Date(admin.created_at).toLocaleString('pt-BR')}</td>
                  <td className="py-4 pr-4">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(admin)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${admin.is_active ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      >
                        {admin.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateLink(admin)}
                        disabled={!admin.auth_user_id}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-brand-blue text-white hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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