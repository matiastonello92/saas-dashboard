// lib/hooks/useUsers.ts
import { useEffect, useMemo, useState } from 'react';
import { countUsers, listUsers, type PaginatedUsers } from '@/lib/services/users';
import { ApiError } from '@/lib/services/client';

type Status = 'idle' | 'loading' | 'success' | 'error';
export type UsersFilter = {
  q?: string;
  status?: 'active' | 'invited' | 'disabled';
  page?: number;
  pageSize?: number;
  perPage?: number;
};

export function useUsers(initial?: UsersFilter) {
  const [filters, setFilters] = useState<UsersFilter>(() => ({
    page: 1,
    perPage: 50,
    ...initial,
  }));
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<Error | ApiError | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [countStatus, setCountStatus] = useState<Status>('idle');
  const [countError, setCountError] = useState<Error | ApiError | null>(null);

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
          perPage: stableFilters.perPage ?? stableFilters.pageSize ?? 50,
          signal: controller.signal,
        });
        if (!mounted) return;
        setData(res);
        setStatus('success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!mounted || e?.name === 'AbortError') return;
        const normalized = normalizeError(e);
        setError(normalized);
        setStatus('error');
      }
    }

    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [stableFilters]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function loadCount() {
      try {
        setCountStatus('loading');
        const totalUsers = await countUsers(controller.signal);
        if (!mounted) return;
        setTotal(totalUsers);
        setCountStatus('success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!mounted || e?.name === 'AbortError') return;
        setCountError(normalizeError(e));
        setCountStatus('error');
      }
    }

    loadCount();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const combinedData = data ? { ...data, total: total ?? data.total ?? null } : null;

  return {
    data: combinedData,
    status,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    filters,
    setFilters,
    total,
    countStatus,
    countError,
  };
}

function normalizeError(error: unknown): Error | ApiError {
  if (error instanceof ApiError) {
    if (error.message && error.message !== 'API error') {
      return error;
    }

    const details = error.details as { message?: string } | undefined;
    const message = details?.message || `Request failed with status ${error.status}`;
    return new ApiError(message, error.status, error.code, error.details);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown error');
}
