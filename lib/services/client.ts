// lib/services/client.ts
// API client centralizzato per Klyra. Usa Supabase JWT per Authorization.
// Non accede mai al DB direttamente: solo chiamate HTTP alle API (es. /api/v1/*).
// Da usare come base nei futuri servizi: metrics.ts, users.ts, subscriptions.ts, ecc.

import { supabaseClient } from '@/lib/supabase';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiFetchInit = Omit<RequestInit, 'method' | 'body' | 'headers'> & {
  /** Dati JSON da inviare nel body (verrà serializzato automaticamente) */
  json?: unknown;
  /** Se true (default), tenta di allegare il token; se 'required', richiede JWT altrimenti errore; se false, non allega */
  auth?: boolean | 'required';
  /** Timeout ms (default: 20000) */
  timeoutMs?: number;
  /** Headers addizionali */
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function getAccessToken(): Promise<string | null> {
  const supabase = supabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new ApiError(`Auth error: ${error.message}`, 401, 'AUTH_SESSION_ERROR', error);
  return data.session?.access_token ?? null;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new ApiError('Request timeout', 408, 'TIMEOUT')), ms);
    p.then(v => { clearTimeout(id); resolve(v); })
     .catch(e => { clearTimeout(id); reject(e); });
  });
}

async function apiRequest<T>(path: string, method: HttpMethod, init: ApiFetchInit = {}): Promise<T> {
  const {
    json,
    auth = true,
    timeoutMs = 20000,
    headers = {},
    ...rest
  } = init;

  // Base URL: stessa origin (Next.js routes tipo /api/v1/*)
  const url = path.startsWith('http') ? path : path;

  const finalHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...headers,
  };

  // JSON body
  let body: BodyInit | undefined;
  if (json !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }

  // JWT
  if (auth) {
    const token = await getAccessToken();
    if (!token && auth === 'required') {
      throw new ApiError('No auth token available', 401, 'UNAUTHENTICATED');
    }
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const fetchPromise = fetch(url, {
    method,
    headers: finalHeaders,
    body,
    ...rest,
  }).then(async (res) => {
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
      const message = (isJson && payload && (payload.message || payload.error)) || res.statusText || 'API error';
      const code = isJson && payload && (payload.code || payload.errorCode);
      throw new ApiError(String(message), res.status, code, payload);
    }

    return (payload as T) ?? (undefined as unknown as T);
  });

  return withTimeout(fetchPromise, timeoutMs);
}

export const api = {
  get: <T>(path: string, init?: ApiFetchInit) => apiRequest<T>(path, 'GET', init),
  post: <T>(path: string, init?: ApiFetchInit) => apiRequest<T>(path, 'POST', init),
  put: <T>(path: string, init?: ApiFetchInit) => apiRequest<T>(path, 'PUT', init),
  patch: <T>(path: string, init?: ApiFetchInit) => apiRequest<T>(path, 'PATCH', init),
  del: <T>(path: string, init?: ApiFetchInit) => apiRequest<T>(path, 'DELETE', init),
};

// Esempi d'uso (nei futuri file di servizio):
// const metrics = await api.get<DashboardMetricsResponse>('/api/v1/admin/dashboard', { auth: 'required' });
// const users = await api.get<PaginatedUsers>('/api/v1/admin/users?limit=20', { auth: 'required' });
// const newUser = await api.post<User>('/api/v1/admin/users', { auth: 'required', json: { email, role } });
