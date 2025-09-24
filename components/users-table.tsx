// components/users-table.tsx
'use client';

import { useState, type ChangeEvent, type MouseEvent } from 'react';
import { useUsers, type UsersFilter } from '@/lib/hooks/useUsers';
import { updateUser, type PaginatedUsers, type UserSummary } from '@/lib/services/users';

// UI già presenti nel repo (adatta solo i path se differiscono)
import { Table } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type StatusFilter = 'all' | 'active' | 'invited' | 'disabled';

function resolveOrganizationName(user: unknown): string {
  if (!user || typeof user !== 'object') {
    return '—';
  }

  const candidate = user as Record<string, unknown>;

  const direct = candidate.org_name;
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct;
  }

  const organization = candidate.organization;
  if (organization && typeof organization === 'object') {
    const organizationName = (organization as Record<string, unknown>).name;
    if (typeof organizationName === 'string' && organizationName.trim().length > 0) {
      return organizationName;
    }
  }

  const organizations = candidate.organizations;
  if (Array.isArray(organizations)) {
    for (const entry of organizations) {
      if (entry && typeof entry === 'object') {
        const organizationName = (entry as Record<string, unknown>).name;
        if (typeof organizationName === 'string' && organizationName.trim().length > 0) {
          return organizationName;
        }
      }
    }
  }

  return '—';
}

export default function UsersTable() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const { data, isLoading, isError, error, filters, setFilters } = useUsers({
    page: 1,
    pageSize: 20,
  });

  const paginatedData: PaginatedUsers | null = data ?? null;
  const total = paginatedData?.total ?? 0;
  const page = paginatedData?.page ?? filters.page ?? 1;
  const pageSize = paginatedData?.perPage ?? filters.perPage ?? filters.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rows: UserSummary[] = paginatedData?.users ?? [];

  function applyFilters(partial: Partial<UsersFilter>) {
    setFilters(prev => ({ ...prev, ...partial }));
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ q: search, page: 1 });
  }

  function handleStatusChange(value: StatusFilter) {
    setStatus(value);
    applyFilters({ status: value === 'all' ? undefined : value, page: 1 });
  }

  function handlePageChange(nextPage: number) {
    applyFilters({ page: nextPage });
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
        <Input
          placeholder="Search users…"
          value={search}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <Select
          value={status}
          onValueChange={(value) => handleStatusChange(value as StatusFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <button type="submit" className="px-3 py-2 rounded-md border">Search</button>
      </form>

      {/* States */}
      {isLoading && <div>Loading users…</div>}
      {isError && <div className="text-red-600">Error: {String(error?.message || 'Failed to load')}</div>}

      {/* Table */}
      {!!rows.length && (
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
            {rows.map((u) => {
              const orgName = resolveOrganizationName(u);

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
      {!isLoading && !isError && rows.length === 0 && (
        <div className="text-sm text-muted-foreground">No users found.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-2">
          <UsersTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

type UsersPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

function UsersTablePagination({ page, pageSize, total, onPageChange }: UsersPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const navigate = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }

    onPageChange(nextPage);
  };

  const createClickHandler = (nextPage: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(nextPage);
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={createClickHandler(page - 1)}
            className={page === 1 ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
        {pageNumbers.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              href="#"
              isActive={pageNumber === page}
              onClick={createClickHandler(pageNumber)}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={createClickHandler(page + 1)}
            className={page === totalPages ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
