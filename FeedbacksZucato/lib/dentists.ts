export const DENTISTS = [
  'Dr Adolpho',
  'Dr Gabriel',
  'Dr Rodrigo',
  'Dr Guto',
  'Dr Murilo Zucato',
  'Dra Jamili',
  'Dra Verônica',
  'Dra Alice',
  'Dra Kátia',
] as const

export type DentistName = (typeof DENTISTS)[number]

export function isValidDentistName(value: string): value is DentistName {
  return DENTISTS.includes(value as DentistName)
}