'use client';

import { Button } from '@graphology/ui';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { LogoutButton } from '../../auth/logout-button';
import { icons, TEACHER_ROUTES } from '../../../lib/constants';
import { useAuth } from '../../../lib/auth';

const UserIcon = icons.user;

export function TeacherProfileMenu(): React.JSX.Element {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const menuId = useId();
  const firstName = user?.firstName.trim() ?? '';
  const lastName = user?.lastName.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const name = fullName.length > 0 ? fullName : 'Teacher';
  const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const initials = userInitials.length > 0 ? userInitials : name.slice(0, 2).toUpperCase();
  const email = user?.email ?? '';

  useEffect(() => {
    if (!open) {
      return;
    }
    firstItemRef.current?.focus();
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
        aria-label="Profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-caption font-semibold">
          {initials}
        </span>
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-1 shadow-lg"
        >
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <UserIcon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              <p className="truncate text-caption text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-border" role="separator" />
          <Link
            ref={firstItemRef}
            href={TEACHER_ROUTES.profile}
            role="menuitem"
            className="block rounded-md px-3 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              setOpen(false);
            }}
          >
            Profile
          </Link>
          <Link
            href={TEACHER_ROUTES.settings}
            role="menuitem"
            className="block rounded-md px-3 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              setOpen(false);
            }}
          >
            Settings
          </Link>
          <LogoutButton className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Logout
          </LogoutButton>
        </div>
      ) : null}
    </div>
  );
}
