'use client';

import { cn } from '@graphology/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { icons } from '../../../lib/constants';
import { adminNavItems } from '../../../lib/admin';

export function AdminNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Admin">
      <ul className="space-y-1">
        {adminNavItems.map((item) => {
          const Icon = icons[item.icon];
          const active =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(`${item.href}/`));
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/70',
                  collapsed && 'justify-center px-2',
                )}
                onClick={onNavigate}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
