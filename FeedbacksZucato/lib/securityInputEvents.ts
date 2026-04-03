import { sanitizeInput, getClientIpFromHeaders } from '@/lib/security'
import { sanitizeTextField, normalizeIntegerInRange } from '@/lib/inputProtection'
import { supabaseAdmin } from '@/lib/supabase'

const SECURITY_INPUT_EVENTS_TABLE = 'security_input_events'

let hasLoggedMissingTableWarning = false

export interface SecurityInputEventRecord {
  id: string
  event_type: string
  source_scope: string | null
  request_path: string | null
  field_name: string | null
  client_ip: string | null
  user_agent: string | null
  payload_preview: string | null
  reason: string | null
  created_at: string
}

export interface RecordSecurityInputEventInput {
  sourceScope: string
  requestPath: string
  fieldName: string
  payload: unknown
  reason?: string | null
}

function isMissingSecurityInputEventsTable(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code.toLowerCase() : ''
  const message = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : ''
  const details = 'details' in error && typeof error.details === 'string' ? error.details.toLowerCase() : ''

  return (
    code === '42p01' ||
    code === 'pgrst205' ||
    message.includes(SECURITY_INPUT_EVENTS_TABLE) ||
    message.includes('relation') ||
    details.includes(SECURITY_INPUT_EVENTS_TABLE)
  )
}

function logMissingTableWarningOnce(operation: string, error: unknown) {
  if (hasLoggedMissingTableWarning) {
    return
  }

  hasLoggedMissingTableWarning = true
  console.warn(
    `[security-input-events] tabela ausente durante ${operation}. Execute scripts/migration-security-input-events.sql no Supabase.`
  )
  console.warn(error)
}

export async function recordSecurityInputEvent(headers: Headers, input: RecordSecurityInputEventInput) {
  const payloadPreview = sanitizeTextField(input.payload, {
    maxLength: 180,
    preserveNewlines: true,
  })

  try {
    const { error } = await supabaseAdmin.from(SECURITY_INPUT_EVENTS_TABLE).insert([
      {
        event_type: 'blocked_sql_payload',
        source_scope: sanitizeTextField(input.sourceScope, { maxLength: 64 }),
        request_path: sanitizeTextField(input.requestPath, { maxLength: 160 }),
        field_name: sanitizeTextField(input.fieldName, { maxLength: 64 }),
        client_ip: sanitizeTextField(getClientIpFromHeaders(headers), { maxLength: 64 }),
        user_agent: sanitizeTextField(headers.get('user-agent') || 'unknown', { maxLength: 300 }),
        payload_preview: payloadPreview ? sanitizeInput(payloadPreview).slice(0, 180) : null,
        reason: input.reason ? sanitizeTextField(input.reason, { maxLength: 240 }) : null,
      },
    ])

    if (error) {
      if (isMissingSecurityInputEventsTable(error)) {
        logMissingTableWarningOnce('gravação', error)
        return { stored: false, skipped: 'missing-table' as const }
      }

      throw error
    }

    return { stored: true }
  } catch (error) {
    if (isMissingSecurityInputEventsTable(error)) {
      logMissingTableWarningOnce('gravação', error)
      return { stored: false, skipped: 'missing-table' as const }
    }

    console.error('Erro ao registrar evento de input suspeito:', error)
    return { stored: false, skipped: 'error' as const }
  }
}

export async function listRecentSecurityInputEvents(limit: number = 20): Promise<SecurityInputEventRecord[]> {
  const normalizedLimit = normalizeIntegerInRange(limit, 20, 1, 50)

  try {
    const { data, error } = await supabaseAdmin
      .from(SECURITY_INPUT_EVENTS_TABLE)
      .select('id, event_type, source_scope, request_path, field_name, client_ip, user_agent, payload_preview, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(normalizedLimit)

    if (error) {
      if (isMissingSecurityInputEventsTable(error)) {
        logMissingTableWarningOnce('leitura', error)
        return []
      }

      throw error
    }

    return data || []
  } catch (error) {
    if (isMissingSecurityInputEventsTable(error)) {
      logMissingTableWarningOnce('leitura', error)
      return []
    }

    console.error('Erro ao listar eventos de input suspeito:', error)
    return []
  }
}