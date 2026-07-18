'use client';

import { Button } from '@graphology/ui';
import { AdminNav } from './admin-nav';
import { icons } from '../../../lib/constants';

export function AdminMobileDrawer({
  open,
  panelId,
  onClose,
}: {
  open: boolean;
  panelId: string;
  onClose: () => void;
}): React.JSX.Element | null {
  if (!open) {
    return null;
  }
  const CloseIcon = icons.close;
  return (
    <div className="fixed inset-0 z-50 laptop:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        aria-label="Close admin menu"
        onClick={onClose}
      />
      <aside
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        className="relative flex h-full w-[min(20rem,85vw)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl"
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <p className="text-sm font-semibold">Admin Console</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close menu"
            onClick={onClose}
          >
            <CloseIcon className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <AdminNav onNavigate={onClose} />
      </aside>
    </div>
  );
}
