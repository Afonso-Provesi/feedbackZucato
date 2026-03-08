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
      primary: '#1e40af', // brand-blue
      secondary: '#f59e0b', // brand-gold
      accent: '#ffffff', // brand-white
      background: '#ffffff',
      text: '#1f2937',
      border: '#e5e7eb'
    },
    brand: {
      name: 'Clínica Odontológica Zucato',
      slogan: 'Cuidando do seu sorriso'
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