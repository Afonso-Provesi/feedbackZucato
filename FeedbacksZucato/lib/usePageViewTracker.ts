'use client'

import { useEffect } from 'react'

export function usePageViewTracker(pageName: string = 'home') {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch('/api/track-page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: pageName,
          }),
        })
      } catch (error) {
        console.error('Erro ao rastrear visualização de página:', error)
      }
    }

    trackPageView()
  }, [pageName])
}
