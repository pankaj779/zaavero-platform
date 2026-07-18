'use client';

import { Button } from '@graphology/ui';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../../dashboard/theme-toggle';
import { TeacherNotificationsMenu, TeacherProfileMenu } from '../../teacher/navigation';
import { TeacherBreadcrumbs } from '../../teacher/layout/teacher-breadcrumbs';
import { getAdminPageMeta } from '../../../lib/admin';
import { ADMIN_ROUTES, icons } from '../../../lib/constants';

export function AdminTopbar({
  onOpenMobile,
  mobileOpen,
  mobilePanelId,
}: {
  onOpenMobile: () => void;
  mobileOpen: boolean;
  mobilePanelId: string;
}): React.JSX.Element {
  const pathname = usePathname();
  const meta = getAdminPageMeta(pathname);
  const MenuIcon = icons.menu;
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 tablet:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="laptop:hidden"
          aria-label="Open admin menu"
          aria-expanded={mobileOpen}
          aria-controls={mobilePanelId}
          onClick={onOpenMobile}
        >
          <MenuIcon className="h-4 w-4" aria-hidden />
        </Button>
        <TeacherBreadcrumbs
          items={[{ label: 'Admin', href: ADMIN_ROUTES.dashboard }, { label: meta.breadcrumb }]}
        />
        <div className="ml-auto flex items-center gap-2">
          <TeacherNotificationsMenu />
          <ThemeToggle />
          <TeacherProfileMenu />
        </div>
      </div>
    </header>
  );
}
