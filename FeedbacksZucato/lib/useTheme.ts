'use client'

import { useState, useEffect } from 'react'
import { ThemeConfig, getCurrentTheme, setTheme as setThemeConfig } from '@/lib/themes'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeConfig>(getCurrentTheme())

  useEffect(() => {
    setThemeState(getCurrentTheme())
  }, [])

  const updateTheme = (themeKey: string) => {
    setThemeConfig(themeKey)
    setThemeState(getCurrentTheme())
  }

  return {
    theme,
    setTheme: updateTheme
  }
}