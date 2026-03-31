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
// Função para gerar caminho obscuro tipo MdGRSpy/Login
export function generateObscureAdminPath(): string {
  // Gera uma string aleatória de 6-8 caracteres misturando maiúsculas/minúsculas
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const len = Math.floor(Math.random() * 3) + 6 // 6 a 8 caracteres
  let part = ''
  for (let i = 0; i < len; i++) {
    part += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${part}/Login`
}

export function generateComplexAdminPath(): string {
  // Mantém compatibilidade antiga, mas pode usar o obscuro se quiser
  return generateObscureAdminPath()
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
  // Só aceita o caminho fixo definido
  if (typeof window === 'undefined') {
    return process.env.ADMIN_PATH === path
  }
  // @ts-ignore
  if (window.ADMIN_PATH) {
    // @ts-ignore
    return window.ADMIN_PATH === path
  }
  return false
}

// Função para obter caminho atual do admin
export function getCurrentAdminPath(): string {
  // Sempre retorna o caminho fixo definido na variável de ambiente
  if (typeof window === 'undefined') {
    if (process.env.ADMIN_PATH) {
      return process.env.ADMIN_PATH
    }
    throw new Error('ADMIN_PATH não definido no ambiente do servidor')
  }
  // Client-side: permite sobrescrever via window.ADMIN_PATH para testes
  // @ts-ignore
  if (window.ADMIN_PATH) {
    // @ts-ignore
    return window.ADMIN_PATH
  }
  throw new Error('ADMIN_PATH não definido no ambiente do navegador')
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