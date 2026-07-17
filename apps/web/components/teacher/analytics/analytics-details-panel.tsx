'use client';

import { useEffect, useRef } from 'react';
import { Button, Card, CardContent, CardHeader } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import {
  teacherAnalyticsPageCopy,
  type TeacherAnalyticsMetricDto,
} from '../../../lib/teacher';

const CloseIcon = icons.close;

function DetailList({
  rows,
}: {
  rows: { id: string; label: string; value: React.ReactNode }[];
}): React.JSX.Element {
  return (
    <dl className="grid gap-2 text-small">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-3 py-2"
        >
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Keyboard-accessible details panel for a selected analytics metric. */
export function AnalyticsDetailsPanel({
  metric,
  onClose,
}: {
  metric: TeacherAnalyticsMetricDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherAnalyticsPageCopy;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [metric.id]);

  return (
    <Card
      role="region"
      aria-label={`${copy.detailsPanelLabel}: ${metric.label}`}
      className="rounded-xl shadow-sm"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5">
        <div className="min-w-0 space-y-2">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            {metric.kind === 'kpi' ? 'KPI' : 'Section'}
          </p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold leading-snug tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {metric.label}
          </h2>
          <p className="text-small text-muted-foreground">
            {`Display value: ${metric.value}`}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={copy.detailsCloseLabel}
          onClick={onClose}
        >
          <CloseIcon className="h-4 w-4" aria-hidden />
        </Button>
      </CardHeader>

      <CardContent className="grid gap-4 p-5 pt-0 tablet:grid-cols-2">
        <DetailList
          rows={[
            {
              id: 'description',
              label: copy.descriptionLabel,
              value: metric.description,
            },
            {
              id: 'source',
              label: copy.calculationSourceLabel,
              value: metric.calculationSource,
            },
          ]}
        />
        <DetailList
          rows={[
            {
              id: 'api',
              label: copy.futureApiLabel,
              value: metric.futureApi,
            },
            {
              id: 'notes',
              label: copy.notesLabel,
              value: metric.notes,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}
