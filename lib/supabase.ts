// lib/supabase.ts
// Single-responsibility: inizializza il client Supabase lato app.
// Non gestisce sessioni SSR: l'auth/permessi arriveranno nello Step 2.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `[supabase] Missing env var: ${name}. ` +
      `Imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local`
    );
  }
  return value;
}

export function supabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}

// Uso (esempio):
// import { supabaseClient } from '@/lib/supabase';
// const supabase = supabaseClient();
