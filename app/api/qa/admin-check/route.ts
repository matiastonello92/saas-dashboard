import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const cookieStore = cookies()
  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(
        name: string,
        value: string,
        options?: {
          domain?: string
          path?: string
          sameSite?: 'lax' | 'strict' | 'none'
          maxAge?: number
          expires?: Date
          httpOnly?: boolean
          secure?: boolean
        }
      ) {
        if (options) {
          cookieStore.set({ name, value, ...options })
        } else {
          cookieStore.set(name, value)
        }
      },
      remove(name: string) {
        cookieStore.delete(name)
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
