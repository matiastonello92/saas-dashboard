// lib/hooks/useDashboardMetrics.ts
// Hook leggerezza-zero per leggere le metriche dashboard usando il service.
// Niente dipendenze esterne, solo useState/useEffect.

import { useEffect, useState } from 'react';
import { getActiveUsersCount, getDashboardMetrics, type DashboardMetrics } from '@/lib/services/metrics';
import { ApiError } from '@/lib/services/client';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useDashboardMetrics() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error | ApiError | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [activeUsersStatus, setActiveUsersStatus] = useState<Status>('idle');
  const [activeUsersError, setActiveUsersError] = useState<Error | ApiError | null>(null);

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
        setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function loadActiveUsers() {
      try {
        setActiveUsersStatus('loading');
        setActiveUsersError(null);
        const result = await getActiveUsersCount(controller.signal);
        if (!mounted) return;
        setActiveUsers(result.total);
        setActiveUsersStatus('success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!mounted) return;
        if (e?.name === 'AbortError') return;
        setActiveUsers(null);
        setActiveUsersStatus('error');
        setActiveUsersError(e instanceof Error ? e : new Error('Failed to load active users count'));
      }
    }

    loadActiveUsers();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    activeUsers,
    activeUsersStatus,
    activeUsersError,
    isActiveUsersLoading: activeUsersStatus === 'loading',
    isActiveUsersError: activeUsersStatus === 'error',
  };
}
