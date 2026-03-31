// Compatibilidade: sempre retorna true e /autumn/audit
export function isValidAdminPath(path: string): boolean {
  return true
}

export function getCurrentAdminPath(): string {
  return '/autumn/audit'
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