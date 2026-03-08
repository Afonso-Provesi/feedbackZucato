'use client'

import FeedbackForm from '@/components/FeedbackForm'
import Image from 'next/image'
import { usePageViewTracker } from '@/lib/usePageViewTracker'
import AdBanner from '@/components/AdBanner'
import { useTheme } from '@/lib/useTheme'

export default function Home() {
  usePageViewTracker('index')
  const { theme } = useTheme()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] py-8">
      <div className="container-feedback w-full">
        {/* Logo da clínica */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src={theme.logo}
              alt={theme.brand.name}
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">{theme.brand.name}</h1>
          {theme.brand.slogan && (
            <p className="text-gray-600 mt-2">{theme.brand.slogan}</p>
          )}
        </div>

        {/* Card de feedback */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-center text-[var(--color-text)] mb-8">
            Como foi sua experiência conosco hoje?
          </h2>

          <FeedbackForm />
        </div>

        {/* Ad Banner */}
        <AdBanner slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME || ''} />
      </div>
    </main>
  )
}
