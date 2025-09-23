'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        router.replace(session ? '/users' : '/login');
      } catch {
        router.replace('/login');
      }
    })();
  }, [router]);

  return <div className="p-6 text-sm text-muted-foreground">Completing sign-in…</div>;
}
