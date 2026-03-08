'use client'

import FeedbackForm from '@/components/FeedbackForm'
import Image from 'next/image'
import { usePageViewTracker } from '@/lib/usePageViewTracker'
import AdBanner from '@/components/AdBanner'

export default function Home() {
  usePageViewTracker('index')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-brand-white py-8">
      <div className="container-feedback w-full">
        {/* Logo da clínica */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/Logo.png"
              alt="Clínica Odontológica Zucato"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-brand-blue">Clínica Odontológica Zucato</h1>
        </div>

        {/* Card de feedback */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-8">
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
