import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSSRClient } from '@/lib/supabase-ssr';

function normalizeAdmins(): string[] {
  const raw = process.env.PLATFORM_ADMINS ?? '';
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

async function resolveRpcAdmin(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_platform_admin');
    if (!error && data === true) {
      return true;
    }
  } catch {
    // ignore: fallback to environment list
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
    const unauthorized = NextResponse.json(
      { error: 'Unauthorized', isPlatformAdmin: false, email: null },
      { status: 401 }
    );
    return applyCookies(unauthorized);
  }

  const email = user.email ?? null;
  const normalizedEmail = email?.toLowerCase() ?? null;
  const allowList = normalizeAdmins();

  let isPlatformAdmin = normalizedEmail ? allowList.includes(normalizedEmail) : false;

  if (!isPlatformAdmin) {
    isPlatformAdmin = await resolveRpcAdmin(supabase);
  }

  const response = NextResponse.json({ isPlatformAdmin, email });
  return applyCookies(response);
}

