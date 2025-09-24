import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

type CookiePayload = {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const cookiesToSet: CookiePayload[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookieList) {
          cookieList.forEach((cookie) => {
            cookiesToSet.push(cookie)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set({ name, value, ...(options ?? {}) })
    })
    return response
  }

  const email = user.email?.toLowerCase() ?? ''
  const whitelist = (process.env.PLATFORM_ADMINS ?? '')
    .toLowerCase()
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const isPlatformAdmin = !!email && whitelist.includes(email)

  const response = NextResponse.json({
    email: user.email ?? null,
    permissions: isPlatformAdmin ? ['platform:admin'] : [],
    role: isPlatformAdmin ? 'platform_admin' : 'user',
  })
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set({ name, value, ...(options ?? {}) })
  })

  return response
}
