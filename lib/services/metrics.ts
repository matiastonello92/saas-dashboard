// lib/services/metrics.ts
// Service per le metriche della dashboard Klyra.
// Fonte dati primaria: API Klyra -> /api/v1/admin/dashboard
// Autenticazione: Supabase JWT (header Authorization) gestito da api client.

import { api } from './client';

export type DashboardMetrics = unknown;
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

/**
 * Esempio d'uso (nei loader/handlers di pagina o nei prossimi step con React Query):
 * const data = await getDashboardMetrics();
 */
