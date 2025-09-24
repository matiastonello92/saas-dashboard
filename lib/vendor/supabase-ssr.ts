import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

// Tipo locale per opzioni cookie (compatibile con NextResponse.cookies.set/delete)
export type CookieOptions = {
  domain?: string;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
};

export type CookieMethods = {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: Partial<CookieOptions>): void;
  remove(name: string, options?: Partial<CookieOptions>): void;
};

export interface CreateServerClientOptions {
  cookies: CookieMethods;
  options?: SupabaseClientOptions;
}

export function createServerClient<
  Database = unknown,
  SchemaName extends string = 'public'
>(
  supabaseUrl: string,
  supabaseKey: string,
  { cookies, options }: CreateServerClientOptions
): SupabaseClient<Database, SchemaName> {
  const defaultOptions: SupabaseClientOptions = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-ssr-adapter',
      },
    },
    cookies,
  };

  return createClient<Database, SchemaName>(supabaseUrl, supabaseKey, {
    ...defaultOptions,
    ...options,
    auth: {
      ...defaultOptions.auth,
      ...options?.auth,
    },
    global: {
      ...defaultOptions.global,
      ...options?.global,
      headers: {
        ...defaultOptions.global?.headers,
        ...options?.global?.headers,
      },
    },
    cookies: cookies ?? options?.cookies,
  });
}

