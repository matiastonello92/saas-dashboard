'use client';

import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[auth] Missing env var: ${name}`);
  }
  return value;
}

export function getBrowserSupabase() {
  if (browserClient) return browserClient;

  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const supabase = getBrowserSupabase();
  await supabase.auth.signOut();
}
