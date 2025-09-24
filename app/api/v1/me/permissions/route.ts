import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSSRClient } from '@/lib/supabase-ssr';

function parseAllowList(): string[] {
  const raw = process.env.PLATFORM_ADMINS ?? '';
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

async function hasRpcAdminFlag(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_platform_admin');
    if (!error && data === true) {
      return true;
    }
  } catch {
    // swallow RPC errors
  }
  return false;
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

  const email = user.email ?? null;
  const normalizedEmail = email?.toLowerCase() ?? null;
  const allowList = parseAllowList();

  let isPlatformAdmin = normalizedEmail ? allowList.includes(normalizedEmail) : false;

  if (!isPlatformAdmin) {
    isPlatformAdmin = await hasRpcAdminFlag(supabase);
  }

  const permissions = isPlatformAdmin ? ['platform:admin'] : [];
  const role = isPlatformAdmin ? 'platform_admin' : 'user';

  const response = NextResponse.json({ email, permissions, role });
  return applyCookies(response);
}

