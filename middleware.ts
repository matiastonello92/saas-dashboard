import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const STATIC_FILE_REGEX = /\.(?:png|jpg|jpeg|svg|ico|css|js|txt|webmanifest)$/

type HeadersWithCookies = Headers & {
  getSetCookie?: () => string[]
  raw?: () => Record<string, string[]>
}

function applySetCookies(target: NextResponse, source: Response) {
  const headerStore = source.headers as HeadersWithCookies
  const raw = headerStore.raw?.()
  const cookies = headerStore.getSetCookie?.() ?? (raw ? raw['set-cookie'] ?? [] : [])

  cookies.forEach((cookie) => {
    target.headers.append('set-cookie', cookie)
  })
}

function redirectWithCookies(url: URL, sourceResponse?: Response) {
  const response = NextResponse.redirect(url)
  if (sourceResponse) {
    applySetCookies(response, sourceResponse)
  }
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/qa/session') ||
    pathname.startsWith('/api/qa/admin-check') ||
    pathname === '/favicon.ico' ||
    STATIC_FILE_REGEX.test(pathname)

  if (isPublic) {
    return NextResponse.next()
  }

  let adminRes: Response
  try {
    adminRes = await fetch(`${origin}/api/qa/admin-check`, {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    })
  } catch {
    return NextResponse.redirect(new URL('/login?error=access_denied', request.url))
  }

  if (adminRes.status === 401) {
    const redirectUrl = new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
    return redirectWithCookies(redirectUrl, adminRes)
  }

  if (!adminRes.ok) {
    return redirectWithCookies(new URL('/login?error=access_denied', request.url), adminRes)
  }

  let payload: unknown
  try {
    payload = await adminRes.json()
  } catch {
    return redirectWithCookies(new URL('/login?error=access_denied', request.url), adminRes)
  }

  if (typeof payload !== 'object' || payload === null || (payload as { isPlatformAdmin?: unknown }).isPlatformAdmin !== true) {
    return redirectWithCookies(new URL('/login?error=access_denied', request.url), adminRes)
  }

  const response = NextResponse.next()
  applySetCookies(response, adminRes)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|css|js|txt|webmanifest)$).*)',
  ],
}
