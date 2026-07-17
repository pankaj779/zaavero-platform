'use client';

import { useEffect, useRef } from 'react';
import { Button, Card, CardContent, CardHeader } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import {
  formatTeacherCalendarDateTime,
  teacherCalendarEventStatusLabel,
  teacherCalendarEventTypeLabel,
  teacherCalendarPageCopy,
  type TeacherCalendarEventDto,
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

/** Selected event details panel — Escape closes. */
export function CalendarEventDetails({
  event,
  onClose,
}: {
  event: TeacherCalendarEventDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherCalendarPageCopy;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [event.id]);

  return (
    <Card
      role="region"
      aria-label={`${copy.detailsLabel}: ${event.title}`}
      className="rounded-xl shadow-sm"
      onKeyDown={(eventKey) => {
        if (eventKey.key === 'Escape') {
          onClose();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5">
        <div className="min-w-0 space-y-2">
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            {teacherCalendarEventTypeLabel[event.type]}
          </p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold leading-snug tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {event.title}
          </h2>
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

      <CardContent className="space-y-4 p-5 pt-0">
        <p className="text-small text-muted-foreground">{event.description}</p>
        <DetailList
          rows={[
            { id: 'type', label: copy.typeLabel, value: teacherCalendarEventTypeLabel[event.type] },
            {
              id: 'status',
              label: copy.statusLabel,
              value: teacherCalendarEventStatusLabel[event.status],
            },
            { id: 'start', label: copy.startLabel, value: formatTeacherCalendarDateTime(event.startTime) },
            { id: 'end', label: copy.endLabel, value: formatTeacherCalendarDateTime(event.endTime) },
            { id: 'timezone', label: copy.timezoneLabel, value: event.timezone },
            {
              id: 'course',
              label: copy.courseLabel,
              value: event.course?.title ?? '—',
            },
            {
              id: 'batch',
              label: copy.batchLabel,
              value: event.batch?.name ?? '—',
            },
            { id: 'mentor', label: copy.mentorLabel, value: event.mentor.name },
            {
              id: 'provider',
              label: copy.providerLabel,
              value: event.meetingProvider ?? copy.meetingUrlPending,
            },
            { id: 'url', label: 'Meeting URL', value: copy.meetingUrlPending },
            { id: 'location', label: copy.locationLabel, value: copy.locationPending },
          ]}
        />
        <section className="space-y-2" aria-label={copy.futureFeaturesLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.futureFeaturesLabel}</h3>
          <DetailList
            rows={[
              { id: 'google', label: 'Google Calendar', value: 'Coming Soon' },
              { id: 'outlook', label: 'Outlook', value: 'Coming Soon' },
              { id: 'meeting', label: 'Meeting provisioning', value: 'Coming Soon' },
              { id: 'reminders', label: 'Reminders', value: 'Coming Soon' },
            ]}
          />
        </section>
        <Button type="button" variant="outline" size="sm" disabled aria-label={`${copy.addReminderButton} — coming soon`}>
          {copy.addReminderButton}
        </Button>
        <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
      </CardContent>
    </Card>
  );
}
