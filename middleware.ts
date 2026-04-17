import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pbAuth = request.cookies.get('pb_auth')

  if (!pbAuth?.value) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    const { token } = JSON.parse(pbAuth.value)
    if (!token) return NextResponse.redirect(new URL('/', request.url))

    // Check JWT expiry (PocketBase tokens are standard JWTs)
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 < Date.now()) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    '/community/:path*',
    '/classroom/:path*',
    '/calendar/:path*',
    '/members/:path*',
    '/about/:path*',
  ],
}
