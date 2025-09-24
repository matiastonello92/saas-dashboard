import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options?: Record<string, unknown>) => {
          actions.push({ type: 'set', name, value, options })
        },
        remove: (name: string, options?: Record<string, unknown>) => {
          actions.push({ type: 'remove', name, options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    applyCookieActions(response, actions)
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
  applyCookieActions(response, actions)

  return response
}
