// components/users-table.tsx
'use client';

import { useState } from 'react';
import { useUsers, type UsersFilter } from '@/lib/hooks/useUsers';
import { updateUser } from '@/lib/services/users';

// UI già presenti nel repo (adatta solo i path se differiscono)
import { Table } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';

type StatusFilter = 'all' | 'active' | 'invited' | 'disabled';

export default function UsersTable() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const { data, isLoading, isError, error, filters, setFilters } = useUsers({
    page: 1,
    pageSize: 20,
  });

  const total = data?.total ?? 0;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  function applyFilters(partial: Partial<UsersFilter>) {
    setFilters(prev => ({ ...prev, ...partial }));
  }

  async function toggleStatus(id: string, current?: 'active' | 'invited' | 'disabled') {
    const next = current === 'disabled' ? 'active' : 'disabled';
    try {
      await updateUser(id, { status: next });
      // ricarica la pagina corrente (mantiene filtri)
      applyFilters({ page });
    } catch (e) {
      console.error('toggleStatus failed', e);
      alert('Operation failed');
    }
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ q: search, page: 1 });
  }

  function onStatusChange(v: StatusFilter) {
    setStatus(v);
    applyFilters({ status: v === 'all' ? undefined : v, page: 1 });
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <form onSubmit={onSearchSubmit} className="flex gap-2 items-center">
        <Input
          placeholder="Search users…"
          value={search}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(e: any) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <Select value={status} onValueChange={(v: any) => onStatusChange(v as StatusFilter)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="disabled">Disabled</option>
        </Select>
        <button type="submit" className="px-3 py-2 rounded-md border">Search</button>
      </form>

      {/* States */}
      {isLoading && <div>Loading users…</div>}
      {isError && <div className="text-red-600">Error: {String(error?.message || 'Failed to load')}</div>}

      {/* Table */}
      {!!data?.items?.length && (
        <Table>
          <thead>
            <tr>
              <th className="text-left">Email</th>
              <th className="text-left">Name</th>
              <th className="text-left">Organization</th>
              <th className="text-left">Status</th>
              <th className="text-left">Created</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => {
              // org fallback: prova una serie di campi comuni senza rompere il layout
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const orgName =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (u as any)?.org_name ??
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (u as any)?.organization?.name ??
                ((u as any)?.organizations?.[0]?.name) ??
                '—';

              return (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.display_name ?? '—'}</td>
                  <td>{orgName}</td>
                  <td>
                    <Badge variant={u.status === 'active' ? 'default' : u.status === 'invited' ? 'secondary' : 'outline'}>
                      {u.status ?? '—'}
                    </Badge>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</td>
                  <td className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStatus(u.id, u.status)}
                      className="px-2 py-1 rounded-md border"
                      title={u.status === 'disabled' ? 'Activate user' : 'Disable user'}
                    >
                      {u.status === 'disabled' ? 'Activate' : 'Disable'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Empty */}
      {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
        <div className="text-sm text-muted-foreground">No users found.</div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="pt-2">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p: number) => applyFilters({ page: p })}
          />
        </div>
      )}
    </div>
  );
}
