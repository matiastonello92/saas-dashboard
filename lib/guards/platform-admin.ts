'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminStatus } from '@/lib/services/me';
import type { ApiError } from '@/lib/services/client';

export async function isPlatformAdminClient(): Promise<boolean> {
  try {
    const status = await fetchAdminStatus();
    return Boolean(status?.isPlatformAdmin);
  } catch {
    return false;
  }
}

export function usePlatformAdminGate(options?: { redirect?: boolean }) {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<Error | ApiError | null>(null);
  const router = useRouter();
  const redirect = options?.redirect ?? true;

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const status = await fetchAdminStatus();
        if (!active) return;
        const allowed = Boolean(status?.isPlatformAdmin);
        setIsAdmin(allowed);
        setError(null);
        if (redirect && !allowed) {
          router.replace('/login?error=access_denied');
        }
      } catch (err) {
        if (!active) return;
        const normalized = err instanceof Error ? err : new Error('Unable to verify admin access');
        setIsAdmin(false);
        setError(normalized);
        if (redirect) {
          router.replace('/login?error=access_denied');
        }
      } finally {
        if (active) {
          setReady(true);
        }
      }
    }

    checkAccess();
    return () => {
      active = false;
    };
  }, [redirect, router]);

  return { ready, isAdmin, error };
}
