// Sistema de segurança para caminhos de admin dinâmicos

// Wordlist expandida para caminhos de admin
export const adminWordlist = [
  'dashboard', 'panel', 'control', 'manage', 'system', 'admin',
  'backend', 'console', 'portal', 'hub', 'center', 'station',
  'command', 'interface', 'gateway', 'access', 'secure', 'private',
  'internal', 'management', 'operations', 'tools', 'utility',
  'analytics', 'monitor', 'overview', 'workspace', 'cockpit',
  'bridge', 'nexus', 'matrix', 'core', 'kernel', 'engine',
  'forge', 'vault', 'sanctuary', 'citadel', 'bastion', 'fortress'
]

// Caracteres para geração aleatória
const randomChars = 'abcdefghijklmnopqrstuvwxyz0123456789'

// Função para gerar caminho aleatório simples (palavra da wordlist)
export function generateSimpleAdminPath(): string {
  const randomIndex = Math.floor(Math.random() * adminWordlist.length)
  return adminWordlist[randomIndex]
}

// Função para gerar caminho complexo (palavra + caracteres aleatórios)
export function generateComplexAdminPath(): string {
  const baseWord = generateSimpleAdminPath()
  const randomSuffix = Array.from({ length: 4 }, () =>
    randomChars[Math.floor(Math.random() * randomChars.length)]
  ).join('')
  return `${baseWord}-${randomSuffix}`
}

// Função para gerar hash único para sessão
export function generateAdminSessionHash(): string {
  // Usar crypto.getRandomValues para compatibilidade com Edge Runtime
  const array = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback para Math.random (menos seguro)
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Função para validar se um caminho é válido
export function isValidAdminPath(path: string): boolean {
  // Verificar se é uma palavra da wordlist
  if (adminWordlist.includes(path)) return true

  // Verificar se é palavra-da-wordlist + - + 4 caracteres
  const complexPattern = /^([a-z]+)-([a-z0-9]{4})$/
  const match = path.match(complexPattern)
  if (match && adminWordlist.includes(match[1])) return true

  return false
}

// Função para obter caminho atual do admin
export function getCurrentAdminPath(): string {
  if (typeof window === 'undefined') {
    // Server-side: usar variável de ambiente ou gerar
    return process.env.ADMIN_PATH || generateComplexAdminPath()
  }

  // Client-side: tentar do sessionStorage (mais seguro que localStorage)
  const stored = sessionStorage.getItem('admin-path')
  if (stored && isValidAdminPath(stored)) {
    return stored
  }

  // Gerar novo se não existir
  const newPath = generateComplexAdminPath()
  sessionStorage.setItem('admin-path', newPath)
  return newPath
}

// Função para definir caminho personalizado (apenas para desenvolvimento)
export function setAdminPath(path: string): void {
  if (isValidAdminPath(path)) {
    sessionStorage.setItem('admin-path', path)
  }
}

// Função para limpar caminho (logout)
export function clearAdminPath(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('admin-path')
  }
}