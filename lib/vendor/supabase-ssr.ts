import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

export type CookieMethods = {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: Partial<import('@supabase/supabase-js').CookieOptions>): void;
  remove(name: string, options?: Partial<import('@supabase/supabase-js').CookieOptions>): void;
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

