'use client';

import { Button } from '@graphology/ui';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { NotificationApi } from '../../../lib/api';
import { useAuth, useOrganization } from '../../../lib/auth';
import { icons, TEACHER_ROUTES } from '../../../lib/constants';
import {
  formatTeacherNotificationRelativeTime,
  type TeacherNotificationDto,
} from '../../../lib/teacher';

const BellIcon = icons.bell;

export function TeacherNotificationsMenu(): React.JSX.Element {
  const { user } = useAuth();
  const { primaryOrganizationId } = useOrganization();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<TeacherNotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attemptedScope, setAttemptedScope] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const viewAllRef = useRef<HTMLAnchorElement>(null);
  const menuId = useId();
  const scope = `${primaryOrganizationId ?? ''}:${user?.id ?? ''}`;

  useEffect(() => {
    setNotifications([]);
    setAttemptedScope('');
    setLoadFailed(false);
  }, [scope]);

  useEffect(() => {
    if (
      !open ||
      primaryOrganizationId === null ||
      user === null ||
      loading ||
      attemptedScope === scope
    ) {
      return;
    }

    setAttemptedScope(scope);
    setLoading(true);
    setLoadFailed(false);
    void NotificationApi.getNotifications({
      organizationId: primaryOrganizationId,
      userId: user.id,
      channel: 'IN_APP',
      page: 1,
      limit: 5,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
      .then((result) => {
        setNotifications(result.items);
      })
      .catch(() => {
        setLoadFailed(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [attemptedScope, loading, open, primaryOrganizationId, scope, user]);

  useEffect(() => {
    if (!open) {
      return;
    }
    viewAllRef.current?.focus();
    const onPointerDown = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
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
        ref={triggerRef}
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
        {notifications.some((item) => item.readAt === null) ? (
          <span className="sr-only">Unread notifications</span>
        ) : null}
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card p-2 shadow-lg"
        >
          <p className="px-2 py-1.5 text-sm font-semibold text-foreground">Notifications</p>
          {loading ? (
            <p className="px-2 py-4 text-caption text-muted-foreground" role="status">
              Loading notifications…
            </p>
          ) : null}
          {!loading && loadFailed ? (
            <div className="space-y-2 px-2 py-3">
              <p className="text-caption text-destructive">Unable to load notifications.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAttemptedScope('');
                }}
              >
                Retry
              </Button>
            </div>
          ) : null}
          {!loading && !loadFailed && notifications.length === 0 ? (
            <p className="px-2 py-4 text-caption text-muted-foreground">No notifications yet.</p>
          ) : null}
          {!loading && !loadFailed && notifications.length > 0 ? (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {notifications.map((item) => (
                <li key={item.id}>
                  <div className="rounded-lg px-2 py-2 hover:bg-muted">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-caption text-muted-foreground">{item.message}</p>
                    <p className="mt-1 text-caption text-muted-foreground">
                      {formatTeacherNotificationRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <Link
            ref={viewAllRef}
            href={TEACHER_ROUTES.notifications}
            role="menuitem"
            className="mt-1 block rounded-md px-2 py-2 text-center text-sm font-medium text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              setOpen(false);
            }}
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}
