// Caminho customizado: /autumn/audit para login e painel
export function isValidAdminPath(path: string): boolean {
  // Permite apenas /autumn/audit
  return path === '/autumn/audit'
}

export function getCurrentAdminPath(): string {
  // Retorna o caminho do painel admin customizado
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