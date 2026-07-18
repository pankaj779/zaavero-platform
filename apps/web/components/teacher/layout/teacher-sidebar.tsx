'use client';

import { Button } from '@graphology/ui';
import { cn } from '@graphology/utils';
import Link from 'next/link';
import { LogoutButton } from '../../auth/logout-button';
import { brandConfig } from '../../../lib/brand';
import { icons, TEACHER_ROUTES } from '../../../lib/constants';
import { TeacherNav } from '../navigation/teacher-nav';

const PanelCloseIcon = icons.panelClose;
const PanelOpenIcon = icons.panelOpen;

export function TeacherSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}): React.JSX.Element {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 motion-reduce:transition-none laptop:flex',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      )}
      aria-label="Sidebar"
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-sidebar-border px-3',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        <Link
          href={TEACHER_ROUTES.dashboard}
          className="truncate text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? brandConfig.logo.text.slice(0, 1) : brandConfig.logo.text}
        </Link>
        {!collapsed ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse sidebar"
            onClick={onToggleCollapse}
          >
            <PanelCloseIcon className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      {collapsed ? (
        <div className="flex justify-center border-b border-sidebar-border py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Expand sidebar"
            onClick={onToggleCollapse}
          >
            <PanelOpenIcon className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
      <TeacherNav collapsed={collapsed} ariaLabel="Teacher" />
      <div className="border-t border-sidebar-border p-3">
        <LogoutButton
          collapsed={collapsed}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors duration-200 motion-reduce:transition-none hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            collapsed && 'justify-center px-2',
          )}
        />
      </div>
    </aside>
  );
}
