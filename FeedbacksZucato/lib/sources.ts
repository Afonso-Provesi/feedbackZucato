export const FEEDBACK_SOURCES = {
  tablet: 'Tablet da clínica',
  whatsapp: 'WhatsApp',
} as const

export type FeedbackSource = keyof typeof FEEDBACK_SOURCES

export const DEFAULT_FEEDBACK_SOURCE: FeedbackSource = 'tablet'

export function normalizeFeedbackSource(value: unknown): FeedbackSource {
  return typeof value === 'string' && value in FEEDBACK_SOURCES
    ? (value as FeedbackSource)
    : DEFAULT_FEEDBACK_SOURCE
}

export function getFeedbackSourceLabel(value: string | null | undefined): string {
  if (value && value in FEEDBACK_SOURCES) {
    return FEEDBACK_SOURCES[value as FeedbackSource]
  }
  return value || '-'
}
