import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export type CookiePayload = {
  name: string
  value: string
  options?: Record<string, unknown>
}

export type SupabaseAuthUser = {
  id: string
  email?: string | null
}

export type AdminUser = {
  id: string
  email?: string | null
  created_at?: string | null
  confirmed_at?: string | null
  email_confirmed_at?: string | null
  last_sign_in_at?: string | null
  banned_until?: string | null
  user_metadata?: Record<string, unknown> | null
  app_metadata?: Record<string, unknown> | null
}

export type AdminUserSummary = {
  id: string
  email: string
  display_name?: string
  created_at?: string
  status: 'active' | 'invited' | 'disabled'
  org_name?: string
  organization?: Record<string, unknown> | null
  organizations?: Array<Record<string, unknown>> | null
}

type EnsureAdminSuccess = {
  ok: true
  cookies: CookiePayload[]
  user: SupabaseAuthUser
  adminClient: ReturnType<typeof createClient>
}

type EnsureAdminFailure = {
  ok: false
  cookies: CookiePayload[]
  status: number
  message: string
}

export type EnsureAdminResult = EnsureAdminSuccess | EnsureAdminFailure

export async function ensureAdmin(request: NextRequest): Promise<EnsureAdminResult> {
  const cookiesToSet: CookiePayload[] = []

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceRole) {
    return {
      ok: false,
      cookies: cookiesToSet,
      status: 500,
      message: 'Server configuration error',
    }
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookies) {
        cookies.forEach((cookie) => {
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
    return {
      ok: false,
      cookies: cookiesToSet,
      status: 401,
      message: 'Unauthorized',
    }
  }

  const adminClient = createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { error: platformError, data: platformRow } = await adminClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (platformError) {
    return {
      ok: false,
      cookies: cookiesToSet,
      status: 500,
      message: 'Server error',
    }
  }

  if (!platformRow) {
    return {
      ok: false,
      cookies: cookiesToSet,
      status: 403,
      message: 'Forbidden',
    }
  }

  return {
    ok: true,
    cookies: cookiesToSet,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    adminClient,
  }
}

function parseBannedUntil(value: string | null | undefined): boolean {
  if (!value) {
    return false
  }

  if (value === 'forever') {
    return true
  }

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp > Date.now()
}

export function deriveStatus(user: AdminUser): 'active' | 'invited' | 'disabled' {
  if (parseBannedUntil(user.banned_until)) {
    return 'disabled'
  }

  if (user.email_confirmed_at || user.confirmed_at || user.last_sign_in_at) {
    return 'active'
  }

  return 'invited'
}

function pickString(values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return undefined
}

export function toUserSummary(user: AdminUser): AdminUserSummary {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>

  const displayName = pickString([
    metadata.full_name,
    metadata.name,
    metadata.display_name,
    metadata.username,
  ])

  const summary: AdminUserSummary = {
    id: user.id,
    email: typeof user.email === 'string' ? user.email : '',
    display_name: displayName,
    created_at: typeof user.created_at === 'string' ? user.created_at : undefined,
    status: deriveStatus(user),
  }

  if (typeof metadata.org_name === 'string') {
    summary.org_name = metadata.org_name
  }

  if (metadata.organization && typeof metadata.organization === 'object') {
    summary.organization = metadata.organization as Record<string, unknown>
  }

  if (Array.isArray(metadata.organizations)) {
    summary.organizations = metadata.organizations as Array<Record<string, unknown>>
  }

  return summary
}

function normalize(value: string): string {
  return value.normalize('NFKD').toLowerCase()
}

function matchesQuery(user: AdminUser, query: string): boolean {
  if (!query) {
    return true
  }

  const normalized = normalize(query)

  if (typeof user.email === 'string' && normalize(user.email).includes(normalized)) {
    return true
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const fields: unknown[] = [
    metadata.full_name,
    metadata.name,
    metadata.display_name,
    metadata.username,
    metadata.org_name,
  ]

  const organization = metadata.organization
  if (organization && typeof organization === 'object') {
    const name = (organization as Record<string, unknown>).name
    fields.push(name)
  }

  const organizations = metadata.organizations
  if (Array.isArray(organizations)) {
    organizations.forEach((entry) => {
      if (entry && typeof entry === 'object') {
        fields.push((entry as Record<string, unknown>).name)
      }
    })
  }

  return fields.some((field) => typeof field === 'string' && normalize(field).includes(normalized))
}

export function filterUsers(
  users: AdminUser[],
  options: { query?: string; status?: 'active' | 'invited' | 'disabled' }
): AdminUser[] {
  const query = options.query?.trim() ?? ''
  const status = options.status

  return users.filter((user) => {
    if (status && deriveStatus(user) !== status) {
      return false
    }

    if (query && !matchesQuery(user, query)) {
      return false
    }

    return true
  })
}

type ListUsersResult = {
  data?: {
    users?: AdminUser[]
    nextPage?: number | null
    lastPage?: number
    total?: number
  }
  error?: { message?: string } | null
}

export async function fetchUsersPage(
  adminClient: ReturnType<typeof createClient>,
  page: number,
  perPage: number
): Promise<{
  users: AdminUser[]
  nextPage: number | null
  total?: number
}> {
  const result = (await adminClient.auth.admin.listUsers({
    page,
    perPage,
  })) as ListUsersResult

  const pageUsers = Array.isArray(result.data?.users) ? result.data?.users ?? [] : []
  const nextPage = typeof result.data?.nextPage === 'number' ? result.data?.nextPage ?? null : null
  const total = typeof result.data?.total === 'number' ? result.data?.total : undefined

  if (result.error) {
    const message = result.error?.message ?? 'Failed to list users'
    throw new Error(message)
  }

  return {
    users: pageUsers,
    nextPage,
    total,
  }
}

export async function fetchAllUsers(
  adminClient: ReturnType<typeof createClient>,
  pageSize: number,
  maxPages = 50
): Promise<{ users: AdminUser[]; total?: number }> {
  const allUsers: AdminUser[] = []
  let total: number | undefined
  let currentPage = 1
  let iterations = 0
  const perPage = Math.max(1, Math.min(pageSize, 100))

  while (iterations < maxPages) {
    iterations += 1
    const { users, nextPage, total: pageTotal } = await fetchUsersPage(adminClient, currentPage, perPage)
    allUsers.push(...users)

    if (typeof pageTotal === 'number') {
      total = pageTotal
    }

    if (!nextPage || nextPage === currentPage) {
      break
    }

    currentPage = nextPage
  }

  return { users: allUsers, total }
}

