import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidAdminPath } from '@/lib/adminPath'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/autumn/login' || pathname === '/autumn/audit') {
    return NextResponse.next()
  }
  if (pathname.startsWith('/autumn')) {
    return NextResponse.redirect(new URL('/404', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/autumn/:path*']
}