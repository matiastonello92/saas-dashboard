'use client';

import { useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useUsers } from '@/lib/hooks/useUsers';
import { usePlatformAdminGate } from '@/lib/guards/platform-admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PER_PAGE_OPTIONS = [25, 50, 100, 150, 200];

export default function UsersPage() {
  const { ready, isAdmin, error: guardError } = usePlatformAdminGate();
  const { data, isLoading, error, filters, setFilters, total, countStatus, countError } = useUsers({
    page: 1,
    perPage: 50,
  });

  const users = data?.users ?? [];
  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? filters.pageSize ?? data?.perPage ?? 50;
  const resolvedTotal = typeof total === 'number' ? total : data?.total ?? null;
  const totalPages = useMemo(() => {
    if (resolvedTotal && perPage) {
      return Math.max(1, Math.ceil(resolvedTotal / perPage));
    }
    if (data?.nextPage) {
      return page + 1;
    }
    return page;
  }, [resolvedTotal, perPage, data?.nextPage, page]);

  const hasNextPage = useMemo(() => {
    if (resolvedTotal && perPage) {
      return page < Math.ceil(resolvedTotal / perPage);
    }
    return data?.nextPage !== null && data?.nextPage !== undefined;
  }, [resolvedTotal, perPage, page, data?.nextPage]);

  const hasPreviousPage = page > 1;

  const summary = useMemo(() => {
    if (users.length === 0) {
      return 'No users found';
    }
    const start = (page - 1) * perPage + 1;
    const end = start + users.length - 1;
    if (resolvedTotal) {
      return `Showing ${start}–${end} of ${resolvedTotal}`;
    }
    return `Showing ${users.length} users`;
  }, [users.length, page, perPage, resolvedTotal]);

  function handlePageChange(nextPage: number) {
    setFilters(prev => ({ ...prev, page: nextPage }));
  }

  function handlePreviousPage() {
    if (hasPreviousPage) {
      handlePageChange(page - 1);
    }
  }

  function handleNextPage() {
    if (data?.nextPage) {
      handlePageChange(data.nextPage);
    } else if (hasNextPage) {
      handlePageChange(page + 1);
    }
  }

  function handlePerPageChange(value: string) {
    const size = Number.parseInt(value, 10);
    if (!Number.isNaN(size)) {
      setFilters(prev => ({ ...prev, perPage: size, page: 1 }));
    }
  }

  const normalizedError = error ?? guardError ?? countError;

  return (
    <DashboardLayout>
      <main className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage platform users and their access.</p>
        </div>

        {!ready ? (
          <div className="text-sm text-muted-foreground">Checking access…</div>
        ) : !isAdmin ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <div className="font-medium mb-1 text-red-200">Access denied</div>
            <p className="text-sm text-red-100/80">Your account is not authorized to view this section.</p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {countStatus === 'loading' && !resolvedTotal ? 'Counting users…' : summary}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PER_PAGE_OPTIONS.map(option => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {normalizedError ? (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
                {normalizedError.message || 'Something went wrong while loading users.'}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20 backdrop-blur">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last sign-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                        Loading users…
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email ?? '—'}</TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                {resolvedTotal ? `Total users: ${resolvedTotal.toLocaleString()}` : countStatus === 'error' ? 'Total unavailable' : ''}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!hasPreviousPage || isLoading}
                >
                  Previous
                </Button>
                <span className="text-sm text-white/70">
                  Page {page} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasNextPage || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>
    </DashboardLayout>
  );
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}
