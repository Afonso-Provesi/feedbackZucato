// Wordlist para gerar caminhos aleatórios de admin
export const adminWordlist = [
  'dashboard', 'panel', 'control', 'manage', 'system', 'admin',
  'backend', 'console', 'portal', 'hub', 'center', 'station',
  'command', 'interface', 'gateway', 'access', 'secure', 'private',
  'internal', 'management', 'operations', 'tools', 'utility'
]

// Função para gerar caminho aleatório
export function generateRandomAdminPath(): string {
  const randomIndex = Math.floor(Math.random() * adminWordlist.length)
  return adminWordlist[randomIndex]
}

// Função para validar se um caminho é válido para admin
export function isValidAdminPath(path: string): boolean {
  return adminWordlist.includes(path)
}

// Função para obter caminho atual do admin
export function getCurrentAdminPath(): string {
  if (typeof window === 'undefined') {
    // Server-side: usar variável de ambiente ou gerar
    return process.env.ADMIN_PATH || 'dashboard'
  }

  // Client-side: tentar do localStorage ou gerar
  const stored = localStorage.getItem('admin-path')
  if (stored && isValidAdminPath(stored)) {
    return stored
  }

  // Gerar novo se não existir
  const newPath = generateRandomAdminPath()
  localStorage.setItem('admin-path', newPath)
  return newPath
}

// Função para definir caminho personalizado
export function setAdminPath(path: string): void {
  if (isValidAdminPath(path)) {
    localStorage.setItem('admin-path', path)
  }
}