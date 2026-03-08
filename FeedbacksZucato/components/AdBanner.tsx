'use client'

import { useEffect } from 'react'

interface AdBannerProps {
  slotId: string
}

export default function AdBanner({ slotId }: AdBannerProps) {
  useEffect(() => {
    // when the script is already loaded, request a new ad
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      try {
        ;(window as any).adsbygoogle.push({})
      } catch (error) {
        // ignore
      }
    }
  }, [])

  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) {
    return null
  }

  return (
    <div className="my-6 text-center">
      {/* eslint-disable-next-line @next/next/next-script-for-ga */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  )
}
