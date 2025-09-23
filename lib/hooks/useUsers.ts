// lib/hooks/useUsers.ts
import { useEffect, useMemo, useState } from 'react';
import { listUsers, type PaginatedUsers } from '@/lib/services/users';
import { ApiError } from '@/lib/services/client';

type Status = 'idle' | 'loading' | 'success' | 'error';
export type UsersFilter = {
  q?: string;
  status?: 'active' | 'invited' | 'disabled';
  page?: number;
  pageSize?: number;
};

export function useUsers(initial?: UsersFilter) {
  const [filters, setFilters] = useState<UsersFilter>({
    page: 1,
    pageSize: 20,
    ...initial,
  });
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error | ApiError | null>(null);

  // Evita richieste duplicate su cambi rapidi dei filtri
  const stableFilters = useMemo(() => ({ ...filters }), [filters]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function load() {
      try {
        setStatus('loading');
        const res = await listUsers({
          page: stableFilters.page ?? 1,
          pageSize: stableFilters.pageSize ?? 20,
          q: stableFilters.q,
          status: stableFilters.status,
          signal: controller.signal,
        });
        if (!mounted) return;
        setData(res);
        setStatus('success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!mounted || e?.name === 'AbortError') return;
        setError(e);
        setStatus('error');
      }
    }

    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [stableFilters]);

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    filters,
    setFilters,
  };
}
