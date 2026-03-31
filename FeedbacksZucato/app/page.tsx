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
    <main className="flex min-h-screen items-center justify-center py-6 sm:py-8">
      <div className="container-feedback w-full">
        <div className="mx-auto max-w-[520px]">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-[0_20px_40px_rgba(21,58,91,0.08)]">
              <Image
                src={theme.logo}
                alt={theme.brand.name}
                width={96}
                height={96}
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-semibold text-[var(--color-primary)] sm:text-4xl">
              Como foi sua experiência hoje?
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)] sm:text-base">
              Sua resposta é rápida e nos ajuda a melhorar o atendimento.
            </p>
          </div>

          <section className="glass-panel rounded-[28px] p-5 sm:p-7">
            <FeedbackForm />
          </section>
        </div>

        <div className="mx-auto mt-6 max-w-[520px]">
          <AdBanner slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME || ''} />
        </div>
      </div>
    </main>
  )
}
