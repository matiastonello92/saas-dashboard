import { createClient } from '@supabase/supabase-js';

// Tipi locali (evitano dipendenze di tipo da supabase-js)
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

// Sostituto locale di SupabaseClientOptions (forma ampia, permissiva)
export type SupabaseClientOptionsLike = Record<string, unknown>;

export interface CreateServerClientOptions {
  cookies: CookieMethods;
  options?: SupabaseClientOptionsLike;
}

export function createServerClient<
  Database = unknown,
  SchemaName extends string = 'public'
>(
  supabaseUrl: string,
  supabaseKey: string,
  { cookies, options }: CreateServerClientOptions
) {
  const defaultOptions = {
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

  const rawOptions = (options ?? {}) as SupabaseClientOptionsLike;
  const typedOptions = rawOptions as SupabaseClientOptionsLike & {
    auth?: Record<string, unknown>;
    global?: {
      headers?: Record<string, unknown>;
    } & Record<string, unknown>;
    cookies?: CookieMethods;
  };

  return createClient<Database, SchemaName>(supabaseUrl, supabaseKey, {
    ...defaultOptions,
    ...rawOptions,
    auth: {
      ...defaultOptions.auth,
      ...(typedOptions.auth as Record<string, unknown> | undefined),
    },
    global: {
      ...defaultOptions.global,
      ...typedOptions.global,
      headers: {
        ...defaultOptions.global?.headers,
        ...(typedOptions.global?.headers as Record<string, unknown> | undefined),
      },
    },
    cookies: cookies ?? typedOptions.cookies,
  });
}

