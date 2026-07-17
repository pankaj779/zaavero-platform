'use client';

import { Button } from '@graphology/ui';
import { useEffect, useId, useRef, useState } from 'react';
import { icons } from '../../../lib/constants';
import { teacherNotificationPlaceholders } from '../../../lib/teacher';

const BellIcon = icons.bell;

export function TeacherNotificationsMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <BellIcon className="h-4 w-4" aria-hidden />
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card p-2 shadow-lg"
        >
          <p className="px-2 py-1.5 text-sm font-semibold text-foreground">Notifications</p>
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {teacherNotificationPlaceholders.map((item) => (
              <li key={item.id}>
                <div className="rounded-lg px-2 py-2 hover:bg-muted">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-caption text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-caption text-muted-foreground">{item.timeLabel}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="px-2 py-2 text-caption text-muted-foreground">
            Notifications are placeholders until backend integration.
          </p>
        </div>
      ) : null}
    </div>
  );
}
