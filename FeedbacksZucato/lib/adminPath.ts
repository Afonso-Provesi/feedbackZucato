const MASKED_ADMIN_PATHS = new Set(['/autumn/login', '/autumn/audit'])

export function isValidAdminPath(path: string): boolean {
  return MASKED_ADMIN_PATHS.has(path)
}

export function getCurrentAdminPath(): string {
  return '/autumn/audit'
}

// Função para definir caminho personalizado (apenas para desenvolvimento)
export function setAdminPath(path: string): void {
  if (typeof window !== 'undefined' && isValidAdminPath(path)) {
    sessionStorage.setItem('admin-path', path)
  }
}

// Função para limpar caminho (logout)
export function clearAdminPath(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('admin-path')
  }
}