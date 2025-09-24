import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

type MiddlewareCookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
}

type AdminCheckResult = {
  isAdmin?: boolean
}

const isPublic = (pathname: string) =>
  pathname === '/login' ||
  pathname.startsWith('/api') ||
  pathname.startsWith('/_next') ||
  pathname === '/favicon.ico'

const mergeCookies = (source: NextResponse, target: NextResponse) => {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })
}

const buildCookieHeader = (req: NextRequest, res: NextResponse) => {
  const combined = new Map<string, string>()

  req.cookies.getAll().forEach((cookie) => {
    combined.set(cookie.name, cookie.value)
  })

  res.cookies.getAll().forEach((cookie) => {
    combined.set(cookie.name, cookie.value)
  })

  return Array.from(combined.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

const redirectToLogin = (
  req: NextRequest,
  baseResponse: NextResponse,
  error?: string
) => {
  const loginUrl = new URL('/login', req.nextUrl.origin)

  if (error) {
    loginUrl.searchParams.set('error', error)
  }

  const redirectResponse = NextResponse.redirect(loginUrl)
  mergeCookies(baseResponse, redirectResponse)
  return redirectResponse
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin))
  }

  const res = NextResponse.next()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options?: MiddlewareCookieOptions) {
        res.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options?: MiddlewareCookieOptions) {
        res.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return redirectToLogin(req, res)
  }

  const adminCheckUrl = new URL('/api/qa/admin-check', req.nextUrl.origin)
  const cookieHeader = buildCookieHeader(req, res)

  try {
    const adminResponse = await fetch(adminCheckUrl.toString(), {
      headers: {
        accept: 'application/json',
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      cache: 'no-store',
    })

    if (adminResponse.status === 401) {
      return redirectToLogin(req, res)
    }

    if (adminResponse.ok) {
      const data = (await adminResponse.json()) as AdminCheckResult

      if (data?.isAdmin) {
        return res
      }

      return redirectToLogin(req, res, 'not_admin')
    }

    if (adminResponse.status === 403) {
      return redirectToLogin(req, res, 'not_admin')
    }
  } catch (error) {
    console.error('Admin role verification failed', error)
  }

  return redirectToLogin(req, res)
}

