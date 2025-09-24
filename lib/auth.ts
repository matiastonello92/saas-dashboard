'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getPublicEnv } from './public-env';

let _clientPromise: Promise<ReturnType<typeof createBrowserClient>> | null = null;

async function getBrowserSupabase() {
  if (_clientPromise) return _clientPromise;
  _clientPromise = (async () => {
    const { url, anon } = await getPublicEnv();
    return createBrowserClient(url, anon);
  })();
  return _clientPromise;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const supabase = await getBrowserSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const supabase = await getBrowserSupabase();
  await supabase.auth.signOut();
}
