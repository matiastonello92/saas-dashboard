import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

type CookiePayload = {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const cookiesToSet: CookiePayload[] = []

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createServerClient(url, anonKey, {
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
  })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set({ name, value, ...(options ?? {}) })
    })
    return response
  }

  const adminDb = createClient(url, serviceRole)
  const { data: row, error: queryError } = await adminDb
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (queryError) {
    const response = NextResponse.json({ error: 'Server error' }, { status: 500 })
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set({ name, value, ...(options ?? {}) })
    })
    return response
  }

  const isPlatformAdmin = !!row

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
