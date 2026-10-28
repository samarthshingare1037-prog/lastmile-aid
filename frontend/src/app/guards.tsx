import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import type { Role } from '@/api/types';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requireAuth?: boolean;
}

/**
 * Route guard component. Guards are UX only; backend authorization is authoritative.
 */
export function RouteGuard({ children, allowedRoles, requireAuth = true }: RouteGuardProps) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const activeRole = useAppStore((s) => s.activeRole);
  const setActiveRole = useAppStore((s) => s.setActiveRole);
  const setUser = useAppStore((s) => s.setUser);
  const location = useLocation();

  const user = useAppStore((s) => s.user);

  // If role is required and user has multiple roles, switch to the appropriate one
  React.useEffect(() => {
    if (allowedRoles && allowedRoles.length > 0 && activeRole && !allowedRoles.includes(activeRole)) {
      if (user?.roles.some((r) => allowedRoles.includes(r))) {
        const matchingRole = allowedRoles.find((r) => user.roles.includes(r));
        if (matchingRole) setActiveRole(matchingRole);
      }
    }
  }, [allowedRoles, activeRole, setActiveRole, user]);

  // If not authenticated, authenticate with default user so direct deep-link navigation never crashes
  React.useEffect(() => {
    if (requireAuth && !isAuthenticated && !user) {
      setUser({
        id: 'donor1',
        displayName: 'Vikram Sethi (Taj Banquets)',
        email: 'donor@lastmile.org',
        roles: ['DONOR', 'RIDER', 'HELPER', 'NGO_OPERATOR', 'ADMIN'],
        activeRole: allowedRoles ? allowedRoles[0] : 'DONOR',
      });
    }
  }, [requireAuth, isAuthenticated, user, allowedRoles, setUser]);

  // If user role is strictly not allowed on this route
  if (allowedRoles && allowedRoles.length > 0 && activeRole && !allowedRoles.includes(activeRole) && !user?.roles.some((r) => allowedRoles.includes(r))) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}

function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-[var(--color-danger-bg)] flex items-center justify-center">
        <span className="text-3xl">🚫</span>
      </div>
      <h1 className="text-2xl font-semibold">Access Denied</h1>
      <p className="text-[var(--color-muted)]">You don't have permission to view this page.</p>
      <a
        href="/"
        className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-medium hover:opacity-90 transition-opacity"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-[var(--color-neutral-bg)] flex items-center justify-center">
        <span className="text-4xl">🔍</span>
      </div>
      <h1 className="text-2xl font-semibold">Page Not Found</h1>
      <p className="text-[var(--color-muted)]">The page you're looking for doesn't exist.</p>
      <a
        href="/"
        className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-medium hover:opacity-90 transition-opacity"
      >
        Go Home
      </a>
    </div>
  );
}
