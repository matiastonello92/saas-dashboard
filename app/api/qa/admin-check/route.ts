import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const cookieStore = cookies()
  // @ts-expect-error: loose types to avoid TS friction
  const supabase = createServerClient(url, anon, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        const opts = options ?? {}
        cookieStore.set({ name, value, ...opts })
      },
      remove: (name, options) => {
        const opts = options ?? {}
        cookieStore.set({ name, value: '', ...opts, maxAge: 0 })
      },
    },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  const user = userData?.user ?? null
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

  const isPlatformAdmin = !!row && !qErr

  const base = { isPlatformAdmin, email: user.email ?? null }

  if (process.env.DEBUG_ADMIN_CHECK === '1') {
    return NextResponse.json({
      ...base,
      debug: {
        urlHash: hash(url),
        userId: user.id,
        qErr: qErr ? { message: qErr.message, details: qErr.details } : null,
        rowFound: !!row,
      },
    })
  }

  return NextResponse.json(base)
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return h
}
