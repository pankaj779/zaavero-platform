'use client';

import { Button } from '@graphology/ui';
import { cn } from '@graphology/utils';
import Link from 'next/link';
import { LogoutButton } from '../../auth/logout-button';
import { brandConfig } from '../../../lib/brand';
import { ADMIN_ROUTES, icons } from '../../../lib/constants';
import { AdminNav } from './admin-nav';

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}): React.JSX.Element {
  const ToggleIcon = collapsed ? icons.panelOpen : icons.panelClose;
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 motion-reduce:transition-none laptop:flex',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      )}
      aria-label="Admin sidebar"
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        <Link
          href={ADMIN_ROUTES.dashboard}
          className="truncate text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? brandConfig.logo.text.slice(0, 1) : `${brandConfig.logo.text} Admin`}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapse}
        >
          <ToggleIcon className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <AdminNav collapsed={collapsed} />
      <div className="border-t border-sidebar-border p-3">
        <LogoutButton
          collapsed={collapsed}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            collapsed && 'justify-center px-2',
          )}
        />
      </div>
    </aside>
  );
}
