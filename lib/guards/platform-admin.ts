'use client';

import { useEffect, useState } from 'react';
import { getMyPermissions } from '@/lib/services/me';

async function loadAdminFlag(): Promise<boolean> {
  try {
    const data = await getMyPermissions();
    const list = Array.isArray(data?.permissions) ? data.permissions : [];
    return list.includes('platform:admin');
  } catch (error) {
    console.error('Failed to resolve admin permissions', error);
    return false;
  }
}

export async function isPlatformAdminClient(): Promise<boolean> {
  return loadAdminFlag();
}

export function usePlatformAdminGate() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadAdminFlag().then((value) => {
      if (!mounted) {
        return;
      }
      setIsAdmin(value);
      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { ready, isAdmin };
}
