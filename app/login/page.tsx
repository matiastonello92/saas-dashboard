'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signInWithEmailPassword } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<string>('/');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const target = searchParams.get('next') || '/';
    setNext(target);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await signInWithEmailPassword(email, password);
      if (authError) {
        const message =
          typeof authError.message === 'string' && authError.message.length > 0
            ? authError.message
            : 'Invalid credentials';
        setError(message);
        return;
      }

      window.location.assign(next);
    } catch (err) {
      const fallback = 'Unable to sign in';
      if (err instanceof Error) {
        setError(err.message || fallback);
      } else if (err && typeof err === 'object' && 'message' in err) {
        const message = (err as { message?: unknown }).message;
        setError(typeof message === 'string' && message.length > 0 ? message : fallback);
      } else {
        setError(fallback);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Admin Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </main>
  );
}
