'use client'

import { ReactNode, useEffect } from 'react'
import { useTheme } from '@/lib/useTheme'

interface ThemeProviderProps {
  children: ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useTheme()

  useEffect(() => {
    // Aplicar cores via CSS custom properties
    const root = document.documentElement

    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-accent', theme.colors.accent)
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-text', theme.colors.text)
    root.style.setProperty('--color-border', theme.colors.border)

    // Atualizar title da página
    document.title = `${theme.brand.name} - Sistema de Feedback`
  }, [theme])

  return <>{children}</>
}