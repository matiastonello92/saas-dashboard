// lib/guards/permissions.tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getMyPermissions, type MyPermission } from '@/lib/services/me';

export interface Permission extends MyPermission {
  id?: string;
  name?: string;
  resource?: string;
  action?: string;
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
        const permissionList = (data.permissions ?? []) as Permission[];
        setPermissions(permissionList);

        const permissionKeys = new Set(
          permissionList
            .map((p) => p.key)
            .filter((key): key is string => typeof key === 'string' && key.length > 0)
        );
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
        const permissionList = (data.permissions ?? []) as Permission[];
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
