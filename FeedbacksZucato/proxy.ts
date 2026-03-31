import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSupabaseSession } from '@/lib/supabase-auth/proxy'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { response, user } = await updateSupabaseSession(request)

  if (pathname === '/autumn/login' || pathname === '/autumn/audit') {
    if (pathname === '/autumn/audit') {
      if (!user) {
        return NextResponse.redirect(new URL('/autumn/login', request.url))
      }
    }

    return response
  }

  if (pathname.startsWith('/autumn')) {
    return NextResponse.redirect(new URL('/404', request.url))
  }

  return response
}

export const config = {
  matcher: ['/autumn/:path*'],
}