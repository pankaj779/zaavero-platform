'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { AdminMobileDrawer } from './admin-mobile-drawer';
import { AdminSidebar } from './admin-sidebar';
import { AdminTopbar } from './admin-topbar';

const STORAGE_KEY = 'zaavero-admin-sidebar-collapsed';
const CONTENT_ID = 'admin-content';

export function AdminShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobilePanelId = useId();

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href={`#${CONTENT_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        Skip to admin content
      </a>
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => {
          setCollapsed((value) => {
            const next = !value;
            window.localStorage.setItem(STORAGE_KEY, String(next));
            return next;
          });
        }}
      />
      <AdminMobileDrawer
        open={mobileOpen}
        panelId={mobilePanelId}
        onClose={() => {
          setMobileOpen(false);
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          onOpenMobile={() => {
            setMobileOpen(true);
          }}
          mobileOpen={mobileOpen}
          mobilePanelId={mobilePanelId}
        />
        <main id={CONTENT_ID} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 tablet:px-6 laptop:py-8">
            {children}
          </div>
        </main>
        <footer className="border-t border-border px-4 py-4 text-center text-caption text-muted-foreground">
          Administrative access is role- and organization-scoped.
        </footer>
      </div>
    </div>
  );
}
