// lib/services/users.ts
// Service per gestione utenti lato admin.
// Fonte primaria: API interne -> /api/admin/users
// Autenticazione: gestita lato server dalle route interne.
// Nota: tipi dettagliati verranno raffinati quando lo schema dell'API è definitivo.

import { api, ApiError } from './client';

export interface UserSummary {
  id: string;
  email: string;
  display_name?: string;
  created_at?: string;
  status?: 'active' | 'invited' | 'disabled';
  org_name?: string;
  organization?: Record<string, unknown> | null;
  organizations?: Array<Record<string, unknown>> | null;
  // estendere quando disponibile lo schema reale
}

export interface PaginatedUsers {
  items: UserSummary[];
  total: number;
  page: number;
  pageSize: number;
  nextPage?: number | null;
}

export interface CreateUserInput {
  email: string;
  display_name?: string;
  // altri campi opzionali (role preset, ecc.) quando disponibili
}

export interface UpdateUserInput {
  display_name?: string;
  status?: 'active' | 'disabled';
  // campi addizionali quando disponibili
}

type UsersListResponse = {
  users?: UserSummary[];
  page?: number;
  perPage?: number;
  nextPage?: number | null;
  total?: number;
};

type UsersCountResponse = {
  total?: number;
};

async function fetchJson<T>(path: string, init: RequestInit & { signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
    cache: init.cache ?? 'no-store',
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    const details =
      (isJson && payload && typeof payload === 'object' &&
        ((payload as Record<string, unknown>).error || (payload as Record<string, unknown>).message)) ||
      response.statusText ||
      'Request failed';

    throw new ApiError(String(details), response.status);
  }

  return (payload as T) ?? (undefined as unknown as T);
}

/**
 * Lista utenti con paginazione/filtri basilari.
 * Esempio: await listUsers({ page: 1, pageSize: 20, q: 'mario' });
 */
export async function listUsers(params?: {
  page?: number;       // default 1
  pageSize?: number;   // default 20
  q?: string;          // fulltext query (opzionale)
  status?: 'active' | 'invited' | 'disabled';
  signal?: AbortSignal;
}): Promise<PaginatedUsers> {
  const { page = 1, pageSize = 20, q, status, signal } = params ?? {};
  const search = new URLSearchParams();
  search.set('page', String(page));
  search.set('perPage', String(pageSize));
  if (q) search.set('q', q);
  if (status) search.set('status', status);

  const data = await fetchJson<UsersListResponse>(`/api/admin/users?${search.toString()}`, {
    method: 'GET',
    signal,
  });

  const items = Array.isArray(data.users) ? data.users : [];
  const resolvedPage = typeof data.page === 'number' && Number.isFinite(data.page) ? data.page : page;
  const resolvedPerPage = typeof data.perPage === 'number' && Number.isFinite(data.perPage) ? data.perPage : pageSize;
  const total = typeof data.total === 'number'
    ? data.total
    : (resolvedPage - 1) * resolvedPerPage + items.length;

  const nextPage = typeof data.nextPage === 'number'
    ? data.nextPage
    : data.nextPage === null
      ? null
      : undefined;

  return {
    items,
    total,
    page: resolvedPage,
    pageSize: resolvedPerPage,
    nextPage,
  };
}

export async function countUsers(params?: {
  q?: string;
  status?: 'active' | 'invited' | 'disabled';
  signal?: AbortSignal;
}): Promise<number> {
  const { q, status, signal } = params ?? {};
  const search = new URLSearchParams();
  if (q) search.set('q', q);
  if (status) search.set('status', status);
  const query = search.toString();

  const data = await fetchJson<UsersCountResponse>(
    query ? `/api/admin/users/count?${query}` : '/api/admin/users/count',
    {
      method: 'GET',
      signal,
    }
  );

  return typeof data.total === 'number' ? data.total : 0;
}

/** Dettaglio utente */
export async function getUser(id: string, signal?: AbortSignal): Promise<UserSummary> {
  if (!id) throw new Error('getUser: missing id');
  return api.get<UserSummary>(`/api/v1/admin/users/${id}`, {
    auth: 'required',
    signal,
  });
}

/** Crea utente (es. invito) */
export async function createUser(input: CreateUserInput): Promise<UserSummary> {
  if (!input?.email) throw new Error('createUser: missing email');
  return api.post<UserSummary>(`/api/v1/admin/users`, {
    auth: 'required',
    json: input,
  });
}

/** Aggiorna utente */
export async function updateUser(id: string, input: UpdateUserInput): Promise<UserSummary> {
  if (!id) throw new Error('updateUser: missing id');
  return api.patch<UserSummary>(`/api/v1/admin/users/${id}`, {
    auth: 'required',
    json: input,
  });
}

/** Elimina/disabilita utente (dipende dalla policy API) */
export async function deleteUser(id: string): Promise<{ success: true }> {
  if (!id) throw new Error('deleteUser: missing id');
  return api.del<{ success: true }>(`/api/v1/admin/users/${id}`, {
    auth: 'required',
  });
}

// TODO (step successivi, file dedicati o qui se l'API lo prevede):
// - assignUserRole(userId, roleId) -> /api/v1/admin/users/:id/roles
// - setUserPermissions(userId, permissions[]) -> /api/v1/admin/users/:id/permissions

/**
 * Esempi d'uso:
 * const { items, total } = await listUsers({ page: 1, pageSize: 20, q: 'andrea' });
 * const user = await getUser('uuid-123');
 * const created = await createUser({ email: 'new@acme.com', display_name: 'New User' });
 * const updated = await updateUser(created.id, { display_name: 'User Updated' });
 * await deleteUser(updated.id);
 */
