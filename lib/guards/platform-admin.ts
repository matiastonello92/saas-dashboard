'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';

export async function isPlatformAdminClient(): Promise<boolean> {
  const supabase = supabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return false;
  }
  const { data, error } = await supabase.rpc('is_platform_admin');
  return !error && Boolean(data);
}

export function usePlatformAdminGate() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await isPlatformAdminClient();
      if (!mounted) {
        return;
      }
      setIsAdmin(ok);
      setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { ready, isAdmin };
}
