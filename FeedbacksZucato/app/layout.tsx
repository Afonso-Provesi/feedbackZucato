import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { getCurrentTheme } from '@/lib/themes'

export const metadata: Metadata = {
  title: 'Sistema de Feedback',
  description: 'Compartilhe sua experiência com a gente',
  openGraph: {
    title: 'Sistema de Feedback',
    description: 'Feedback de pacientes',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[var(--color-background)] text-[var(--color-text)]">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
