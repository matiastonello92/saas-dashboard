// app/users/page.tsx
import UsersTable from '@/components/users-table';

export const metadata = { title: 'Users — Admin' };

export default function UsersPage() {
  return (
    <main className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage users, organizations and statuses.</p>
      </div>
      <UsersTable />
    </main>
  );
}
