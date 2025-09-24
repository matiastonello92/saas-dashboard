// lib/services/users.ts
// Service per gestione utenti lato admin.
// Fonte primaria: API Klyra -> /api/v1/admin/users
// Autenticazione: Supabase JWT (gestito da api client).
// Nota: tipi dettagliati verranno raffinati quando lo schema dell'API è definitivo.

import { api } from './client';

export interface UserSummary {
  id: string;
  email: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  display_name?: string;
  status?: 'active' | 'invited' | 'disabled';
}

export interface PaginatedUsers {
  users: UserSummary[];
  page: number;
  perPage: number;
  nextPage: number | null;
  total?: number;
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

/**
 * Lista utenti con paginazione/filtri basilari.
 * Esempio: await listUsers({ page: 1, pageSize: 20, q: 'mario' });
 */
export async function listUsers(params?: {
  page?: number;
  pageSize?: number;
  perPage?: number;
  signal?: AbortSignal;
}): Promise<PaginatedUsers> {
  const { page = 1, pageSize, perPage: perPageParam, signal } = params ?? {};
  const size = perPageParam ?? pageSize ?? 50;
  const perPage = Math.min(200, Math.max(1, size));

  const search = new URLSearchParams();
  search.set('page', String(page));
  search.set('perPage', String(perPage));

  return api.get<PaginatedUsers>(`/api/admin/users?${search.toString()}`, {
    auth: 'required',
    signal,
  });
}

export async function countUsers(signal?: AbortSignal): Promise<number> {
  const result = await api.get<{ total: number }>(`/api/admin/users/count`, {
    auth: 'required',
    signal,
  });
  return typeof result?.total === 'number' ? result.total : 0;
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
