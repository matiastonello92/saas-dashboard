import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import {
  ensureAdmin,
  filterUsers,
  toUserSummary,
  fetchAllUsers,
  fetchUsersPage,
  type CookiePayload,
} from './_utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 100

function applyCookies(response: NextResponse, cookies: CookiePayload[]) {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set({ name, value, ...(options ?? {}) })
  })
}

function parsePositiveInt(value: string | null, fallback: number, max?: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  if (max && parsed > max) {
    return max
  }

  return parsed
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

  const page = parsePositiveInt(searchParams.get('page'), 1)
  const perPage = parsePositiveInt(searchParams.get('perPage'), DEFAULT_PER_PAGE, MAX_PER_PAGE)
  const query = searchParams.get('q')?.trim() ?? ''
  const status = normalizeStatus(searchParams.get('status'))

  const shouldFilter = Boolean(query) || Boolean(status)

  try {
    if (shouldFilter) {
      const { users: allUsers } = await fetchAllUsers(adminClient, Math.max(perPage, MAX_PER_PAGE))
      const filtered = filterUsers(allUsers, { query, status })

      const startIndex = Math.max(0, (page - 1) * perPage)
      const paginated = filtered.slice(startIndex, startIndex + perPage)
      const nextPage = startIndex + perPage < filtered.length ? page + 1 : null

      const response = NextResponse.json({
        users: paginated.map((user) => toUserSummary(user)),
        page,
        perPage,
        nextPage,
        total: filtered.length,
      })
      applyCookies(response, cookies)
      return response
    }

    const { users, nextPage, total } = await fetchUsersPage(adminClient, page, perPage)
    const summaries = users.map((user) => toUserSummary(user))

    const computedTotal = typeof total === 'number'
      ? total
      : (page - 1) * perPage + summaries.length

    const computedNextPage = typeof total === 'number'
      ? (page * perPage < total ? page + 1 : null)
      : (nextPage && nextPage > page ? nextPage : null)

    const response = NextResponse.json({
      users: summaries,
      page,
      perPage,
      nextPage: computedNextPage,
      total: computedTotal,
    })
    applyCookies(response, cookies)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load users'
    const response = NextResponse.json({ error: message }, { status: 500 })
    applyCookies(response, cookies)
    return response
  }
}

