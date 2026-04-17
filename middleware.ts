import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
  }
)

// Protect community routes — landing page (/) stays public
export const config = {
  matcher: [
    "/community/:path*",
    "/classroom/:path*",
    "/calendar/:path*",
    "/members/:path*",
    "/about/:path*",
  ],
}
