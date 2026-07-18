'use client';

import { Button } from '@graphology/ui';
import { LogoutButton } from '../../auth/logout-button';
import { brandConfig } from '../../../lib/brand';
import { icons } from '../../../lib/constants';
import { TeacherNav } from '../navigation/teacher-nav';

const CloseIcon = icons.close;

export function TeacherMobileDrawer({
  open,
  onClose,
  panelId,
}: {
  open: boolean;
  onClose: () => void;
  panelId: string;
}): React.JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 laptop:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        aria-label="Close navigation overlay"
        onClick={onClose}
      />
      <aside
        id={panelId}
        className="absolute left-0 top-0 flex h-full w-[min(100%,18rem)] flex-col bg-sidebar text-sidebar-foreground shadow-lg"
        aria-label="Mobile sidebar"
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <span className="text-sm font-semibold">{brandConfig.logo.text}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close menu"
            onClick={onClose}
          >
            <CloseIcon className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <TeacherNav ariaLabel="Teacher" onNavigate={onClose} />
        <div className="border-t border-sidebar-border p-3">
          <LogoutButton className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
      </aside>
    </div>
  );
}
