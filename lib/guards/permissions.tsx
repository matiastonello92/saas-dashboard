// lib/guards/permissions.tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getMyPermissions, type MyPermission } from '@/lib/services/me';

export type Permission = {
  key: string;
  scope?: string | null;
  id?: string;
  name?: string;
  resource?: string;
  action?: string;
};

function normalizePermissions(entries: MyPermission[] | undefined): Permission[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      if (typeof entry === 'string') {
        return { key: entry } satisfies Permission;
      }
      if (entry && typeof entry === 'object' && typeof entry.key === 'string') {
        return { ...entry } satisfies Permission;
      }
      return null;
    })
    .filter((value): value is Permission => {
      return !!value && typeof value.key === 'string' && value.key.trim().length > 0;
    })
    .map((permission) => ({
      ...permission,
      key: permission.key.trim(),
    }));
}

export interface PermissionGuardProps {
  children: ReactNode;
  permission: string; // chiave permesso es. "admin:read"
  fallback?: ReactNode;
}

export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const [, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const data = await getMyPermissions();
        const permissionList = normalizePermissions(data.permissions);
        setPermissions(permissionList);

        const permissionKeys = new Set(permissionList.map((p) => p.key));
        const requiredKey = permission.trim();

        setHasPermission(requiredKey.length > 0 && permissionKeys.has(requiredKey));
      } catch (error) {
        console.error('Failed to load permissions:', error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, [permission]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!hasPermission) {
    return fallback;
  }

  return <>{children}</>;
}

// Hook per usare i permessi in altri componenti
export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const data = await getMyPermissions();
        const permissionList = normalizePermissions(data.permissions);
        setPermissions(permissionList);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, []);

  const hasPermission = (requiredKey: string): boolean => {
    const normalizedKey = requiredKey.trim();
    if (!normalizedKey) {
      return false;
    }

    return permissions.some((p) => p.key === normalizedKey);
  };

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
  };
}
