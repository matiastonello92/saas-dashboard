'use client';

import { useState, type FormEvent } from 'react';
import { signInWithOtp } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    setStatus('loading');
    setError(null);

    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : '/auth/callback';

      await signInWithOtp({ email, options: { redirectTo } });
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in';
      setError(message);
      setStatus('error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a magic link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? 'Sending magic link…' : 'Send magic link'}
          </Button>
        </form>

        {status === 'success' ? (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Check your email to sign in.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
