import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

type MutableCookies = {
  getAll(): Array<{ name: string; value: string; options?: Record<string, unknown> }>
  set(name: string, value: string, options?: Record<string, unknown>): void
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return (cookies() as unknown as MutableCookies).getAll()
      },
      setAll(cookiesToSet) {
        const store = cookies() as unknown as MutableCookies
        cookiesToSet.forEach(({ name, value, options }) => {
          store.set(name, value, options as Record<string, unknown> | undefined)
        })
      },
    },
  })

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (!user || userErr) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminDb = createClient(url, service)
  const { data: row, error: qErr } = await adminDb
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (qErr) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  const isPlatformAdmin = !!row
  return NextResponse.json({ isPlatformAdmin, email: user.email ?? null })
}
