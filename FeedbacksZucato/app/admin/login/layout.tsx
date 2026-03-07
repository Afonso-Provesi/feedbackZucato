'use client'

import { ReactNode } from 'react'

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  // Layout da página de login não faz verificação de autenticação
  return <>{children}</>
}
