// lib/services/metrics.ts
// Service per le metriche della dashboard Klyra.
// Fonte dati primaria: API Klyra -> /api/v1/admin/dashboard
// Autenticazione: Supabase JWT (header Authorization) gestito da api client.

import { api } from './client';

export type DashboardMetrics = unknown;

export type ActiveUsersCount = {
  total: number;
};
// Suggerimento per futuri refinement tipo:
// export interface DashboardMetrics {
//   totalUsers: number;
//   activeSubscribers: number;
//   mrr: number;
//   arr: number;
//   churnRate?: number;
//   growth7d?: number;
//   // ...allineare allo schema reale dell'API quando disponibile
// }

/**
 * Recupera le metriche aggregate per la dashboard admin.
 * Richiede autenticazione: allega automaticamente il JWT (auth: 'required').
 */
export async function getDashboardMetrics(signal?: AbortSignal): Promise<DashboardMetrics> {
  return api.get<DashboardMetrics>('/api/v1/admin/dashboard', {
    auth: 'required',
    signal,
    // timeoutMs: 20000 // default dal client; opzionale personalizzare
  });
}

function parseCountPayload(payload: unknown): ActiveUsersCount {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid response payload');
  }

  const candidate = payload as { total?: unknown };

  if (typeof candidate.total !== 'number' || Number.isNaN(candidate.total)) {
    throw new Error('Invalid total value in response');
  }

  return { total: candidate.total };
}

export async function getActiveUsersCount(signal?: AbortSignal): Promise<ActiveUsersCount> {
  const response = await fetch('/api/admin/users/count', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const payloadRecord = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
    const message =
      payloadRecord && typeof payloadRecord.error === 'string'
        ? String(payloadRecord.error)
        : `Failed to fetch active users count (status ${response.status})`;

    throw new Error(message);
  }

  try {
    return parseCountPayload(payload);
  } catch {
    throw new Error('Invalid active users count response');
  }
}

/**
 * Esempio d'uso (nei loader/handlers di pagina o nei prossimi step con React Query):
 * const data = await getDashboardMetrics();
 */
