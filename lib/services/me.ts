// lib/services/me.ts
// Service per informazioni dell'utente corrente (me) e permessi.
// Endpoints previsti: /api/v1/me/permissions (primario), /api/qa/session (debug).

import { api } from './client';

export interface AdminStatusResponse {
  isPlatformAdmin: boolean;
  email: string | null;
}

export interface PermissionsPayload {
  email: string | null;
  permissions: string[];
  role: string;
}

export interface MyPermission {
  key: string;           // es. 'admin:read'
  scope?: string | null; // es. 'org:123', 'location:abc'
}

export interface MyPermissionsResponse {
  permissions: MyPermission[];
  roles?: string[];      // opzionale: elenco ruoli risolti lato API
  email?: string | null;
  isPlatformAdmin?: boolean;
}

export interface SessionDebug {
  userId?: string | null;
  email?: string | null;
  isPlatformAdmin?: boolean;
  isOrgAdmin?: boolean;
  issuedAt?: string | null;
  expiresAt?: string | null;
}

/** Ritorna lo stato admin dal guard globale. */
export async function fetchAdminStatus(signal?: AbortSignal): Promise<AdminStatusResponse> {
  return api.get<AdminStatusResponse>('/api/qa/admin-check', {
    auth: 'required',
    signal,
  });
}

/** Recupera i permessi raw dall'API interna. */
export async function fetchPermissions(signal?: AbortSignal): Promise<PermissionsPayload> {
  return api.get<PermissionsPayload>('/api/v1/me/permissions', {
    auth: 'required',
    signal,
  });
}

/** Ritorna i permessi dell'utente corrente (compatibile con i guard esistenti). */
export async function getMyPermissions(signal?: AbortSignal): Promise<MyPermissionsResponse> {
  const data = await fetchPermissions(signal);

  const permissions: MyPermission[] = (data.permissions ?? []).map((key) => ({ key }));
  const isPlatformAdmin = data.role === 'platform_admin' || data.permissions.includes('platform:admin');
  const roles = data.role ? [data.role] : [];

  return {
    permissions,
    roles,
    email: data.email,
    isPlatformAdmin,
  };
}

/** Endpoint di debug/info sessione (opzionale, se presente lato API). */
export async function getSessionDebug(signal?: AbortSignal): Promise<SessionDebug> {
  return api.get<SessionDebug>('/api/qa/session', {
    auth: 'required',
    signal,
  });
}
