# 🎨 Sistema de Temas - Personalização por Clínica

Este sistema permite personalizar cores, logos e branding para diferentes clínicas sem alterar o código principal.

## 📁 Arquivos Relacionados

- `lib/themes.ts` - Configurações de temas disponíveis
- `lib/useTheme.ts` - Hook para usar temas no React
- `components/ThemeProvider.tsx` - Provider que aplica cores dinamicamente
- `.env.example` - Variável `NEXT_PUBLIC_THEME` para selecionar tema

## 🚀 Como Adicionar um Novo Tema

### 1. Adicionar no arquivo `lib/themes.ts`

```typescript
export const themes: Record<string, ThemeConfig> = {
  // Tema existente...
  zucato: { ... },

  // Novo tema
  clinica_xyz: {
    name: 'Clínica XYZ',
    logo: '/logo-xyz.png',
    colors: {
      primary: '#2563eb',    // Azul principal
      secondary: '#f59e0b',  // Laranja/accent
      accent: '#ffffff',    // Branco
      background: '#ffffff',
      text: '#1f2937',      // Cinza escuro
      border: '#e5e7eb'     // Cinza claro
    },
    brand: {
      name: 'Clínica XYZ',
      slogan: 'Cuidando da sua saúde'
    }
  }
}
```

### 2. Adicionar o Logo

- Coloque o logo em `public/logo-xyz.png`
- Recomendado: 120x120px, formato PNG com fundo transparente

### 3. Configurar a Clínica

#### Opção A: Via Variável de Ambiente (Recomendado)
```env
NEXT_PUBLIC_THEME=clinica_xyz
```

#### Opção B: Via localStorage (para desenvolvimento)
```javascript
// No console do navegador
localStorage.setItem('clinic-theme', 'clinica_xyz')
window.location.reload()
```

## 🎨 Cores Disponíveis

As cores são aplicadas automaticamente via CSS custom properties:

- `--color-primary`: Cor principal (botões, títulos)
- `--color-secondary`: Cor secundária (acentos)
- `--color-accent`: Cor de destaque
- `--color-background`: Fundo da página
- `--color-text`: Cor do texto
- `--color-border`: Bordas e divisores

## 📱 Áreas Personalizáveis

### Página Principal
- Logo da clínica
- Nome da clínica
- Slogan (opcional)
- Cores do texto e botões

### Área Admin
- Logo no header
- Nome no título do dashboard
- Cores dos elementos

## 🔧 Como Funciona

1. **Server-side**: Usa `NEXT_PUBLIC_THEME` ou padrão 'zucato'
2. **Client-side**: Pode ser alterado via localStorage
3. **CSS**: Cores aplicadas via variáveis CSS custom properties
4. **React**: Hook `useTheme()` para acessar configuração atual

## 📋 Checklist para Nova Clínica

- [ ] Adicionar tema em `lib/themes.ts`
- [ ] Adicionar logo em `public/`
- [ ] Testar cores em diferentes dispositivos
- [ ] Configurar variável de ambiente
- [ ] Testar página principal e admin

## 🎯 Exemplo de Tema

```typescript
odontoclinica_abc: {
  name: 'Odontoclinica ABC',
  logo: '/logo-abc.png',
  colors: {
    primary: '#059669',      // Verde
    secondary: '#dc2626',    // Vermelho
    accent: '#f3f4f6',       // Cinza claro
    background: '#ffffff',   // Branco
    text: '#111827',         // Cinza escuro
    border: '#d1d5db'        // Cinza médio
  },
  brand: {
    name: 'Odontoclinica ABC',
    slogan: 'Sorria com confiança'
  }
}
```