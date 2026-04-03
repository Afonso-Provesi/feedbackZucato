'use client'

interface SecurityInputEvent {
  id: string
  event_type: string
  source_scope: string | null
  request_path: string | null
  field_name: string | null
  client_ip: string | null
  payload_preview: string | null
  reason: string | null
  created_at: string
}

interface SecurityInputEventsPanelProps {
  events: SecurityInputEvent[]
}

export default function SecurityInputEventsPanel({ events }: SecurityInputEventsPanelProps) {
  return (
    <section className="rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.84)] p-6 shadow-[0_20px_44px_rgba(21,58,91,0.08)] mb-8">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Segurança</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--color-primary)]">Entradas Bloqueadas</h3>
          <p className="text-sm text-[var(--text-soft)] mt-1">
            Tentativas recentes barradas pelas proteções de payload suspeito para auditoria administrativa.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-[22px] border border-[rgba(21,58,91,0.08)] bg-[rgba(21,58,91,0.03)] p-4 text-sm text-[var(--text-soft)]">
          Nenhuma entrada suspeita registrada até o momento.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[22px] border border-[rgba(21,58,91,0.08)]">
          <table className="min-w-[980px] w-full table-fixed text-sm">
            <thead className="border-b border-[rgba(21,58,91,0.08)] bg-[rgba(21,58,91,0.04)]">
              <tr>
                <th className="w-[170px] text-left p-3 text-[var(--text-soft)] font-semibold">Data</th>
                <th className="w-[140px] text-left p-3 text-[var(--text-soft)] font-semibold">Origem</th>
                <th className="w-[150px] text-left p-3 text-[var(--text-soft)] font-semibold">Campo</th>
                <th className="w-[170px] text-left p-3 text-[var(--text-soft)] font-semibold">IP</th>
                <th className="w-[170px] text-left p-3 text-[var(--text-soft)] font-semibold">Rota</th>
                <th className="w-[320px] text-left p-3 text-[var(--text-soft)] font-semibold">Trecho bloqueado</th>
                <th className="w-[260px] text-left p-3 text-[var(--text-soft)] font-semibold">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-[rgba(21,58,91,0.06)] align-top hover:bg-[rgba(21,58,91,0.03)]">
                  <td className="p-3 text-[var(--color-text)]">
                    {new Date(event.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3 text-[var(--color-text)]">{event.source_scope || '-'}</td>
                  <td className="p-3 text-[var(--color-text)]">{event.field_name || '-'}</td>
                  <td className="p-3 font-mono text-[var(--text-soft)] text-xs">{event.client_ip || '-'}</td>
                  <td className="p-3 font-mono text-[var(--text-soft)] text-xs">{event.request_path || '-'}</td>
                  <td className="p-3 text-[var(--text-soft)] break-words">{event.payload_preview || '-'}</td>
                  <td className="p-3 text-[var(--text-soft)]">{event.reason || event.event_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}