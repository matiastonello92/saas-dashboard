import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSSRClient } from '@/lib/supabase-ssr';

const SAFE_CAP = 50000;
const PAGE_SIZE = 200;

function normalizeAdmins(): string[] {
  return (process.env.PLATFORM_ADMINS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

async function isPlatformAdmin(supabase: SupabaseClient, email: string | null): Promise<boolean> {
  const normalizedEmail = email?.toLowerCase() ?? null;
  const allowList = normalizeAdmins();

  if (normalizedEmail && allowList.includes(normalizedEmail)) {
    return true;
  }

  try {
    const { data, error } = await supabase.rpc('is_platform_admin');
    return !error && data === true;
  } catch {
    return false;
  }
}

function env(name: string, value: string | undefined): string {
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

  const admin = await isPlatformAdmin(supabase, user.email ?? null);
  if (!admin) {
    const forbidden = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return applyCookies(forbidden);
  }

  let serviceClient;
  try {
    const url = env('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
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

  let total = 0;
  let page = 1;

  while (total < SAFE_CAP) {
    const { data, error: listError } = await serviceClient.auth.admin.listUsers({ page, perPage: PAGE_SIZE });

    if (listError) {
      const failure = NextResponse.json({ error: listError.message }, { status: 500 });
      return applyCookies(failure);
    }

    const batchCount = data?.users?.length ?? 0;
    total += batchCount;

    if (!data?.users || data.users.length < PAGE_SIZE) {
      break;
    }

    page += 1;

    if (page * PAGE_SIZE >= SAFE_CAP) {
      // TODO: switch to metadata count when Supabase exposes a total count
      break;
    }
  }

  const response = NextResponse.json({ total });
  return applyCookies(response);
}

