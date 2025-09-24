import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import {
  ensureAdmin,
  filterUsers,
  fetchAllUsers,
  fetchUsersPage,
  type CookiePayload,
} from '../_utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_PAGE_SIZE = 100

function applyCookies(response: NextResponse, cookies: CookiePayload[]) {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set({ name, value, ...(options ?? {}) })
  })
}

function normalizeStatus(value: string | null): 'active' | 'invited' | 'disabled' | undefined {
  if (!value) {
    return undefined
  }

  if (value === 'active' || value === 'invited' || value === 'disabled') {
    return value
  }

  return undefined
}

export async function GET(request: NextRequest) {
  const adminResult = await ensureAdmin(request)

  if (!adminResult.ok) {
    const response = NextResponse.json({ error: adminResult.message }, { status: adminResult.status })
    applyCookies(response, adminResult.cookies)
    return response
  }

  const { adminClient, cookies } = adminResult
  const { searchParams } = new URL(request.url)

  const query = searchParams.get('q')?.trim() ?? ''
  const status = normalizeStatus(searchParams.get('status'))
  const shouldFilter = Boolean(query) || Boolean(status)

  try {
    if (shouldFilter) {
      const { users: allUsers } = await fetchAllUsers(adminClient, MAX_PAGE_SIZE)
      const filtered = filterUsers(allUsers, { query, status })

      const response = NextResponse.json({ total: filtered.length })
      applyCookies(response, cookies)
      return response
    }

    const { users, total } = await fetchUsersPage(adminClient, 1, 1)
    const resolvedTotal = typeof total === 'number' ? total : users.length

    const response = NextResponse.json({ total: resolvedTotal })
    applyCookies(response, cookies)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to count users'
    const response = NextResponse.json({ error: message }, { status: 500 })
    applyCookies(response, cookies)
    return response
  }
}

