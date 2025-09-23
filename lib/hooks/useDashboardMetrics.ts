// lib/hooks/useDashboardMetrics.ts
// Hook leggerezza-zero per leggere le metriche dashboard usando il service.
// Niente dipendenze esterne, solo useState/useEffect.

import { useEffect, useState } from 'react';
import { getDashboardMetrics, type DashboardMetrics } from '@/lib/services/metrics';
import { ApiError } from '@/lib/services/client';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useDashboardMetrics() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error | ApiError | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function load() {
      try {
        setStatus('loading');
        const res = await getDashboardMetrics(controller.signal);
        if (!mounted) return;
        setData(res ?? null);
        setStatus('success');
      } catch (e: any) {
        if (!mounted) return;
        if (e?.name === 'AbortError') return;
        setError(e);
        setStatus('error');
      }
    }

    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return { data, status, error, isLoading: status === 'loading', isError: status === 'error' };
}
