'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { TeacherFooter } from './teacher-footer';
import { TeacherMobileDrawer } from './teacher-mobile-drawer';
import { TeacherSidebar } from './teacher-sidebar';
import { TeacherTopbar } from './teacher-topbar';

const SIDEBAR_STORAGE_KEY = 'zaavero-teacher-sidebar-collapsed';
const MAIN_CONTENT_ID = 'teacher-content';

export function TeacherShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobilePanelId = useId();

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === 'true') {
      setCollapsed(true);
    }
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

  const toggleCollapsed = (): void => {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      <TeacherSidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />

      <TeacherMobileDrawer
        open={mobileOpen}
        onClose={() => {
          setMobileOpen(false);
        }}
        panelId={mobilePanelId}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TeacherTopbar
          onOpenMobile={() => {
            setMobileOpen(true);
          }}
          mobileOpen={mobileOpen}
          mobilePanelId={mobilePanelId}
        />

        <main id={MAIN_CONTENT_ID} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 tablet:px-6 laptop:py-8">{children}</div>
        </main>

        <TeacherFooter />
      </div>
    </div>
  );
}
