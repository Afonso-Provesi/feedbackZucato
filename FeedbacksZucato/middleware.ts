import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidAdminPath } from '@/lib/adminPath'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar se é uma rota de admin
  if (pathname.startsWith('/admin/')) {
    const adminPath = pathname.split('/')[2] // /admin/[path]

    // Se não tem path ou path é inválido, redirecionar para 404
    if (!adminPath || !isValidAdminPath(adminPath)) {
      return NextResponse.redirect(new URL('/404', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}