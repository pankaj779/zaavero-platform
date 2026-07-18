'use client';

import { cn } from '@graphology/utils';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { icons, ROUTES } from '../../lib/constants';
import { useAuth } from '../../lib/auth';

const LogoutIcon = icons.logout;

/**
 * Logout control — clears NestJS session then redirects to login.
 * Drop-in replacement for portal "Logout" links without redesigning chrome.
 */
export function LogoutButton({
  className,
  collapsed = false,
  children,
}: {
  className?: string;
  collapsed?: boolean;
  children?: ReactNode;
}): React.JSX.Element {
  const { logout } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className={cn(className)}
      onClick={() => {
        void (async () => {
          setPending(true);
          try {
            await logout();
          } finally {
            router.replace(ROUTES.login);
            setPending(false);
          }
        })();
      }}
    >
      {children ?? (
        <>
          <LogoutIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span className={cn(collapsed && 'sr-only')}>{pending ? 'Signing out…' : 'Logout'}</span>
        </>
      )}
    </button>
  );
}
