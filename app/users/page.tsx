'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import UsersTable from '@/components/users-table';
import { supabaseClient } from '@/lib/supabase';
import { usePlatformAdminGate } from '@/lib/guards/platform-admin';

export default function UsersPage() {
  const [readySession, setReadySession] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const { ready: readyAdmin, isAdmin } = usePlatformAdminGate();

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }
      setSignedIn(!!session);
      setReadySession(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const ready = readySession && readyAdmin;

  return (
    <DashboardLayout>
      <main className="p-4 md:p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage users, organizations and statuses.</p>
        </div>

        {!ready ? (
          <div className="text-sm text-muted-foreground">Checking access…</div>
        ) : !signedIn ? (
          <div className="rounded-lg border p-4">
            <div className="font-medium mb-1">You must sign in</div>
            <a className="text-primary underline" href="/login">Go to login</a>
          </div>
        ) : !isAdmin ? (
          <div className="rounded-lg border p-4">
            <div className="font-medium mb-1">Access denied</div>
            <p className="text-sm text-muted-foreground">Your account is not a platform admin.</p>
          </div>
        ) : (
          <UsersTable />
        )}
      </main>
    </DashboardLayout>
  );
}
