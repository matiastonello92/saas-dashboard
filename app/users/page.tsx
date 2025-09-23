'use client';

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import UsersTable from '@/components/users-table';
import { DashboardLayout } from '@/components/dashboard-layout';

export default function UsersPage() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        setSignedIn(!!session);
      } catch {
        setSignedIn(false);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  return (
    <DashboardLayout>
      <main className="space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage users, organizations and statuses.
          </p>
        </div>

        {!ready ? (
          <div className="text-sm text-muted-foreground">Checking session…</div>
        ) : !signedIn ? (
          <div className="rounded-lg border p-4">
            <div className="font-medium">You must sign in</div>
            <a className="text-primary underline" href="/login">
              Go to login
            </a>
          </div>
        ) : (
          <UsersTable />
        )}
      </main>
    </DashboardLayout>
  );
}
