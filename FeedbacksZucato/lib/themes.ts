// Configurações de temas para diferentes clínicas
export interface ThemeConfig {
  name: string
  logo: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    border: string
  }
  brand: {
    name: string
    slogan?: string
  }
}

// Temas disponíveis
export const themes: Record<string, ThemeConfig> = {
  zucato: {
    name: 'Clínica Odontológica Zucato',
    logo: '/Logo.png',
    colors: {
      primary: '#153a5b',
      secondary: '#b58a57',
      accent: '#fffaf3',
      background: '#f6f1e8',
      text: '#203040',
      border: '#d8c7ae'
    },
    brand: {
      name: 'Clínica Odontológica Zucato',
      slogan: 'Implantes dentários com acolhimento, precisão e confiança'
    }
  },
  // Exemplo de outro tema - pode ser adicionado dinamicamente
  exemplo: {
    name: 'Clínica Exemplo',
    logo: '/logo-exemplo.png',
    colors: {
      primary: '#059669', // green-600
      secondary: '#dc2626', // red-600
      accent: '#f3f4f6',
      background: '#ffffff',
      text: '#111827',
      border: '#d1d5db'
    },
    brand: {
      name: 'Clínica Exemplo',
      slogan: 'Saúde e bem-estar'
    }
  }
}

// Tema padrão
export const defaultTheme = themes.zucato

// Função para obter tema atual
export function getCurrentTheme(): ThemeConfig {
  if (typeof window === 'undefined') {
    // Server-side: usar variável de ambiente ou padrão
    const themeKey = process.env.NEXT_PUBLIC_THEME || 'zucato'
    return themes[themeKey] || defaultTheme
  }

  // Client-side: tentar do localStorage ou padrão
  const themeKey = localStorage.getItem('clinic-theme') || process.env.NEXT_PUBLIC_THEME || 'zucato'
  return themes[themeKey] || defaultTheme
}

// Função para definir tema
export function setTheme(themeKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('clinic-theme', themeKey)
    // Forçar reload para aplicar mudanças
    window.location.reload()
  }
}