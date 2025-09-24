import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type CookieOptions = {
  domain?: string;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
};

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

type CookieAdapter = {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
  remove(name: string, options?: CookieOptions): void;
};

export interface SSRClientResult {
  supabase: ReturnType<typeof createServerClient>;
  response: NextResponse;
  applyCookies: (response: NextResponse) => NextResponse;
}

export function createSSRClient(req: NextRequest): SSRClientResult {
  const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const res = NextResponse.next({ request: { headers: req.headers } });

  const cookies: CookieAdapter = {
    get(name) {
      return req.cookies.get(name)?.value;
    },
    set(name, value, options) {
      res.cookies.set(name, value, options);
    },
    remove(name) {
      res.cookies.delete(name);
    },
  };

  const supabase = createServerClient(url, anon, { cookies });

  const applyCookies = (target: NextResponse) => {
    res.cookies.getAll().forEach((cookie) => {
      target.cookies.set(cookie);
    });
    return target;
  };

  return { supabase, response: res, applyCookies };
}

