import { NextRequest, NextResponse } from 'next/server'

// Middleware de arranque para detectar subdominios y llevarlos a su portal interno.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const host = req.headers.get('host') || ''

  // Evitamos tocar assets, APIs y rutas internas de Next.
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const subdomain = getSubdomain(host)

  if (subdomain && subdomain !== 'www') {
    if (subdomain === 'admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/superadmin'
      const response = NextResponse.rewrite(url)
      response.headers.set('x-tenant-subdomain', subdomain)
      return response
    }

    const url = req.nextUrl.clone()
    url.pathname = `/portal/${subdomain}${pathname === '/' ? '' : pathname}`
    const response = NextResponse.rewrite(url)
    response.headers.set('x-tenant-subdomain', subdomain)
    return response
  }

  return NextResponse.next()
}

function getSubdomain(host: string) {
  const hostname = host.split(':')[0]
  const parts = hostname.split('.')

  // En localhost usamos el primer segmento como tenant: alpha.localhost:3000.
  if (hostname.includes('localhost')) {
    return parts.length > 1 ? parts[0] : ''
  }

  // En producción asumimos subdominio + dominio raíz: alpha.gympro.com.
  return parts.length > 2 ? parts[0] : ''
}

export const config = {
  matcher: ['/:path*'],
}
