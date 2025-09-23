// lib/services/me.ts
// Service per informazioni dell'utente corrente (me) e permessi.
// Endpoints previsti: /api/v1/me/permissions (primario), /api/qa/session (debug).

import { api } from './client';

export interface MyPermission {
  key: string;           // es. 'admin:read'
  scope?: string | null; // es. 'org:123', 'location:abc'
}

export interface MyPermissionsResponse {
  permissions: MyPermission[];
  roles?: string[];      // opzionale: elenco ruoli risolti lato API
}

export interface SessionDebug {
  userId?: string | null;
  email?: string | null;
  isPlatformAdmin?: boolean;
  isOrgAdmin?: boolean;
  issuedAt?: string | null;
  expiresAt?: string | null;
}

/** Ritorna i permessi dell'utente corrente. */
export async function getMyPermissions(signal?: AbortSignal): Promise<MyPermissionsResponse> {
  return api.get<MyPermissionsResponse>('/api/v1/me/permissions', {
    auth: 'required',
    signal,
  });
}

/** Endpoint di debug/info sessione (opzionale, se presente lato API). */
export async function getSessionDebug(signal?: AbortSignal): Promise<SessionDebug> {
  return api.get<SessionDebug>('/api/qa/session', {
    auth: 'required',
    signal,
  });
}
