'use client';

let cached: { url: string; anon: string } | null = null;

export async function getPublicEnv(): Promise<{ url: string; anon: string }> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL as string) || '';
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || '';

  if (url && anon) {
    cached = { url, anon };
    return cached;
  }

  if (cached) return cached;
  const res = await fetch('/api/public-env', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load public env');
  const data = (await res.json()) as { url: string; anon: string };
  cached = data;
  return cached;
}
