// Caminho fixo e estático para admin, definido apenas por ADMIN_PATH do .env.local
export function isValidAdminPath(path: string): boolean {
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

export function getCurrentAdminPath(): string {
  if (typeof window === 'undefined') {
    if (process.env.ADMIN_PATH) {
      return process.env.ADMIN_PATH
    }
    throw new Error('ADMIN_PATH não definido no ambiente do servidor')
  }
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