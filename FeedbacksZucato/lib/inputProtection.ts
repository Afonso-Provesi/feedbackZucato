export interface TextFieldValidationOptions {
  maxLength?: number
  preserveNewlines?: boolean
  allowEmpty?: boolean
  fieldLabel?: string
}

export type TextFieldValidationFailureKind = 'empty' | 'suspicious'

const CONTROL_CHARACTERS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g
const SQL_INJECTION_PATTERNS = [
  /(?:^|['"`;\s])union(?:\s+all)?\s+select\b/i,
  /(?:^|['"`;\s])(drop|truncate|alter)\s+(table|database|schema)\b/i,
  /(?:^|['"`;\s])insert\s+into\b/i,
  /(?:^|['"`;\s])delete\s+from\b/i,
  /(?:^|['"`;\s])update\s+\w+\s+set\b/i,
  /\b(information_schema|pg_sleep|sleep\s*\(|benchmark\s*\(|waitfor\s+delay|xp_cmdshell)\b/i,
  /['"`]\s*(or|and)\s+['"\w(]+\s*=\s*['"\w(]+/i,
  /;\s*(select|insert|update|delete|drop|alter|truncate|create|union)\b/i,
  /(--|\/\*|\*\/)\s*(select|insert|update|delete|drop|alter|truncate|create|union|exec|execute)?/i,
] as const

function collapseWhitespace(value: string, preserveNewlines: boolean): string {
  if (preserveNewlines) {
    return value
      .replace(/\r\n?/g, '\n')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  return value.replace(/\s+/g, ' ').trim()
}

function normalizeTextCharacters(value: string): string {
  return value
    .normalize('NFKC')
    .replace(CONTROL_CHARACTERS_REGEX, '')
    .replace(ZERO_WIDTH_REGEX, '')
}

export function normalizeTextFieldForEditing(value: unknown, options: Pick<TextFieldValidationOptions, 'maxLength' | 'preserveNewlines'> = {}): string {
  const {
    maxLength = 500,
    preserveNewlines = false,
  } = options

  const rawValue = typeof value === 'string' ? value : ''
  const normalizedValue = normalizeTextCharacters(rawValue)

  if (preserveNewlines) {
    return normalizedValue
      .replace(/\r\n?/g, '\n')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .slice(0, maxLength)
  }

  return normalizedValue.replace(/\s+/g, ' ').slice(0, maxLength)
}

export function sanitizeTextField(value: unknown, options: TextFieldValidationOptions = {}): string {
  const {
    maxLength = 500,
    preserveNewlines = false,
  } = options

  const rawValue = typeof value === 'string' ? value : ''

  const normalizedValue = normalizeTextCharacters(rawValue)

  return collapseWhitespace(normalizedValue, preserveNewlines).slice(0, maxLength)
}

export function normalizeEmailInput(value: unknown): string {
  return sanitizeTextField(value, { maxLength: 254 }).toLowerCase()
}

export function containsSuspiciousSqlPayload(value: string): boolean {
  const normalizedValue = value.normalize('NFKC')
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(normalizedValue))
}

export function validateTextField(value: unknown, options: TextFieldValidationOptions = {}) {
  const {
    allowEmpty = true,
    fieldLabel = 'texto',
  } = options

  const sanitizedValue = sanitizeTextField(value, options)

  if (!sanitizedValue) {
    if (allowEmpty) {
      return {
        ok: true,
        sanitizedValue,
        failureKind: null,
      }
    }

    return {
      ok: false,
      sanitizedValue,
      failureKind: 'empty' as const,
      error: `Informe ${fieldLabel}.`,
    }
  }

  if (containsSuspiciousSqlPayload(sanitizedValue)) {
    return {
      ok: false,
      sanitizedValue,
      failureKind: 'suspicious' as const,
      error: `Conteúdo inválido detectado no campo ${fieldLabel}.`,
    }
  }

  return {
    ok: true,
    sanitizedValue,
    failureKind: null,
  }
}

export function isValidDashboardDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function isValidTrackedPageInput(value: string): boolean {
  if (!/^[a-z0-9][a-z0-9/_-]{0,119}$/i.test(value)) {
    return false
  }

  if (value.includes('..')) {
    return false
  }

  return !containsSuspiciousSqlPayload(value)
}

export function normalizeIntegerInRange(value: unknown, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)))
}