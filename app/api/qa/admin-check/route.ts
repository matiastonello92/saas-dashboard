import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

type CookieAction = {
  type: 'set' | 'remove'
  name: string
  value?: string
  options?: Record<string, unknown>
}

function applyCookieActions(response: NextResponse, actions: CookieAction[]) {
  actions.forEach((action) => {
    if (action.type === 'set') {
      response.cookies.set(action.name, action.value ?? '', action.options)
    } else {
      response.cookies.delete(action.name)
    }
  })
}

export async function GET(request: NextRequest) {
  const actions: CookieAction[] = []

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createServerClient(url, anon, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options?: Record<string, unknown>) => {
        actions.push({ type: 'set', name, value, options })
      },
      remove: (name: string, options?: Record<string, unknown>) => {
        actions.push({ type: 'remove', name, options })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    applyCookieActions(response, actions)
    return response
  }

  const adminDb = createClient(url, service)
  const { count, error } = await adminDb
    .from('platform_admins')
    .select('user_id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) {
    const response = NextResponse.json({ error: 'Server error' }, { status: 500 })
    applyCookieActions(response, actions)
    return response
  }

  const isPlatformAdmin = (count ?? 0) > 0
  const response = NextResponse.json({
    isPlatformAdmin,
    email: user.email ?? null,
    userId: user.id,
  })
  applyCookieActions(response, actions)

  return response
}
