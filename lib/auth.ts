// lib/auth.ts
// Auth di base con Supabase: OTP email, signOut, getSession e listener.
// Non modifica la UI; fornisce solo funzioni da richiamare nei prossimi step.

import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabaseClient } from './supabase';

export type SignInOtpParams = {
  email: string;
  options?: {
    redirectTo?: string; // URL di redirect post-login (verifica email)
    shouldCreateUser?: boolean; // default true
  }
};

export async function signInWithOtp({ email, options }: SignInOtpParams) {
  const supabase = supabaseClient();
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: options?.redirectTo,
      shouldCreateUser: options?.shouldCreateUser ?? true,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = supabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function getSession(): Promise<Session | null> {
  const supabase = supabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

/**
 * Listener dei cambi di stato auth.
 * Ritorna una funzione di unsubscribe per rimuovere il listener.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const supabase = supabaseClient();
  const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => {
    subscription.subscription?.unsubscribe();
  };
}

// Esempi d'uso (non eseguire qui):
// await signInWithOtp({ email: 'user@example.com', options: { redirectTo: 'https://app.example.com/auth/callback' } });
// await signOut();
// const session = await getSession();
// const off = onAuthStateChange((event, session) => console.log(event, session)); // off() per rimuovere
