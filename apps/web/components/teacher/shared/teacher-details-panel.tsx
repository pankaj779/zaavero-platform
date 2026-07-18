'use client';

import { useEffect, useRef } from 'react';
import { Button, Card, CardContent, CardHeader } from '@graphology/ui';
import { icons } from '../../../lib/constants';

const CloseIcon = icons.close;

/**
 * Shared dismissible details panel shell for Teacher Portal modules.
 * Focuses the heading on open; Escape closes when the panel has focus.
 */
export function TeacherDetailsPanel({
  ariaLabel,
  closeLabel,
  title,
  eyebrow,
  subtitle,
  onClose,
  focusKey,
  children,
  contentClassName = 'space-y-4 p-5 pt-0',
}: {
  ariaLabel: string;
  closeLabel: string;
  title: string;
  eyebrow?: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  /** Value that changes when a new entity is selected (typically entity id). */
  focusKey: string;
  children: React.ReactNode;
  contentClassName?: string;
}): React.JSX.Element {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [focusKey]);

  return (
    <Card
      role="region"
      aria-label={ariaLabel}
      className="rounded-xl shadow-sm"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5">
        <div className="min-w-0 space-y-2">
          {eyebrow}
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold leading-snug tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {title}
          </h2>
          {subtitle}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={closeLabel}
          onClick={onClose}
        >
          <CloseIcon className="h-4 w-4" aria-hidden />
        </Button>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
