'use client';

import { cn } from '@graphology/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { icons, TEACHER_ROUTES } from '../../../lib/constants';
import { teacherNavItems } from '../../../lib/teacher';

function isTeacherNavActive(pathname: string, href: string): boolean {
  if (href === TEACHER_ROUTES.dashboard) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TeacherNav({
  collapsed = false,
  onNavigate,
  ariaLabel = 'Teacher',
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  ariaLabel?: string;
}): React.JSX.Element {
  const pathname = usePathname();

  const items = useMemo(
    () =>
      teacherNavItems.map((item) => ({
        ...item,
        Icon: icons[item.icon],
        active: isTeacherNavActive(pathname, item.href),
      })),
    [pathname],
  );

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label={ariaLabel}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          title={item.label}
          aria-current={item.active ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors duration-200 motion-reduce:transition-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            item.active && 'bg-sidebar-accent text-sidebar-accent-foreground',
            collapsed && 'justify-center px-2',
          )}
          onClick={onNavigate}
        >
          <item.Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
