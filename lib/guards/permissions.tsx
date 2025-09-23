// lib/guards/permissions.tsx
'use client';

import { useEffect, useState } from 'react';
import { getMyPermissions } from '@/lib/services/me';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string; // formato: "resource:action" es. "users:read", "users:write"
  fallback?: React.ReactNode;
}

export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const data = await getMyPermissions();
        setPermissions(data.permissions || []);
        
        // Check se l'utente ha il permesso richiesto
        const [resource, action] = permission.split(':');
        const hasAccess = data.permissions?.some((p: Permission) => 
          p.resource === resource && p.action === action
        ) || false;
        
        setHasPermission(hasAccess);
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
        setPermissions(data.permissions || []);
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

  const hasPermission = (permission: string): boolean => {
    const [resource, action] = permission.split(':');
    return permissions.some(p => p.resource === resource && p.action === action);
  };

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
  };
}
