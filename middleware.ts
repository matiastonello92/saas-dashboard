import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()

  const publicPaths = ['/login', '/api/qa/session', '/api/health']
  const { pathname } = request.nextUrl

  const isPublicPath =
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    /\.(?:png|jpg|jpeg|svg|ico|css|js|txt|webmanifest)$/.test(pathname)

  if (isPublicPath) {
    return res
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options?: Record<string, unknown>) => {
          res.cookies.set(name, value, options)
        },
        remove: (name: string, options?: Record<string, unknown>) => {
          void options
          res.cookies.delete(name)
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const email = user.email?.toLowerCase() ?? ''
  const whitelist = (process.env.PLATFORM_ADMINS ?? '')
    .toLowerCase()
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const isAdmin = !!email && whitelist.includes(email)

  if (!isAdmin) {
    return NextResponse.redirect(new URL('/login?error=access_denied', request.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|css|js|txt|webmanifest)$).*)',
  ],
}
