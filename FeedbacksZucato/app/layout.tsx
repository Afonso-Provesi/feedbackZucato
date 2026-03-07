import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clínica Odontológica Zucato - Feedback',
  description: 'Compartilhe sua experiência com a gente',
  openGraph: {
    title: 'Clínica Odontológica Zucato',
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
      <body className="bg-brand-white">
        {children}
      </body>
    </html>
  )
}
