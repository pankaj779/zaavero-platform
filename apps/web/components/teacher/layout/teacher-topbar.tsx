'use client';

import { Button, SearchInput } from '@graphology/ui';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../../dashboard/theme-toggle';
import { icons, TEACHER_ROUTES } from '../../../lib/constants';
import { getTeacherPageMeta } from '../../../lib/teacher';
import { TeacherNotificationsMenu, TeacherProfileMenu } from '../navigation';
import { TeacherBreadcrumbs } from './teacher-breadcrumbs';

const MenuIcon = icons.menu;

export function TeacherTopbar({
  onOpenMobile,
  mobileOpen,
  mobilePanelId,
}: {
  onOpenMobile: () => void;
  mobileOpen: boolean;
  mobilePanelId: string;
}): React.JSX.Element {
  const pathname = usePathname();
  const meta = getTeacherPageMeta(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 tablet:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="laptop:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls={mobilePanelId}
          onClick={onOpenMobile}
        >
          <MenuIcon className="h-4 w-4" aria-hidden />
        </Button>

        <TeacherBreadcrumbs
          items={[
            { label: 'Home', href: TEACHER_ROUTES.dashboard },
            { label: meta.breadcrumb },
          ]}
        />

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 tablet:max-w-sm laptop:max-w-md">
          <div className="hidden w-full tablet:block">
            <SearchInput placeholder="Search courses, students, and more" aria-label="Search" />
          </div>

          <TeacherNotificationsMenu />
          <ThemeToggle />
          <TeacherProfileMenu />
        </div>
      </div>
    </header>
  );
}
