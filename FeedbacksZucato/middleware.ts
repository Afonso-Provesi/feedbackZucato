import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidAdminPath } from '@/lib/adminPath'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Só permite acesso ao ADMIN_PATH
  const adminPath = process.env.ADMIN_PATH || ''
  if (adminPath && pathname === adminPath) {
    return NextResponse.next()
  }
  // Bloqueia qualquer outro acesso ao painel
  if (pathname.startsWith('/admin') || pathname === adminPath) {
    return NextResponse.redirect(new URL('/404', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/autumn/audit']
}