import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSSRClient } from '@/lib/supabase-ssr';

function parseAdmins(): string[] {
  return (process.env.PLATFORM_ADMINS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

async function userIsAdmin(supabase: SupabaseClient, email: string | null): Promise<boolean> {
  const normalized = email?.toLowerCase() ?? null;
  const allowList = parseAdmins();

  if (normalized && allowList.includes(normalized)) {
    return true;
  }

  try {
    const { data, error } = await supabase.rpc('is_platform_admin');
    return !error && data === true;
  } catch {
    return false;
  }
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function GET(req: NextRequest) {
  const { supabase, applyCookies } = createSSRClient(req);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const unauthorized = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return applyCookies(unauthorized);
  }

  const isAdmin = await userIsAdmin(supabase, user.email ?? null);
  if (!isAdmin) {
    const forbidden = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return applyCookies(forbidden);
  }

  const search = new URL(req.url).searchParams;
  const pageParam = Number.parseInt(search.get('page') ?? '1', 10);
  const perPageParam = Number.parseInt(search.get('perPage') ?? '50', 10);

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const perPageRaw = Number.isFinite(perPageParam) && perPageParam > 0 ? perPageParam : 50;
  const perPage = Math.min(200, Math.max(1, perPageRaw));

  let serviceClient;
  try {
    const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
    serviceClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (envError) {
    const response = NextResponse.json(
      { error: envError instanceof Error ? envError.message : 'Missing configuration' },
      { status: 500 }
    );
    return applyCookies(response);
  }

  const { data, error: adminError } = await serviceClient.auth.admin.listUsers({ page, perPage });

  if (adminError) {
    const failure = NextResponse.json({ error: adminError.message }, { status: 500 });
    return applyCookies(failure);
  }

  const users = (data?.users ?? []).map((entry) => ({
    id: entry.id,
    email: entry.email,
    created_at: entry.created_at,
    last_sign_in_at: entry.last_sign_in_at,
  }));

  const nextPage = users.length === perPage ? page + 1 : null;

  const response = NextResponse.json({ users, page, perPage, nextPage });
  return applyCookies(response);
}

