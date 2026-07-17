'use client';

import { useEffect, useRef } from 'react';
import { Button, Card, CardContent, CardHeader } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import {
  formatAttendanceDate,
  formatAttendanceDateTime,
  teacherAttendancePageCopy,
  type AttendanceSessionDto,
} from '../../../lib/teacher';
import { AttendanceRecordBadge } from './attendance-record-badge';
import { SessionStatusBadge } from './session-status-badge';

const CloseIcon = icons.close;

/**
 * Reusable session details panel — session info, student attendance roster with
 * Present/Absent badges, and an overall summary. Moves focus to its heading on
 * open and supports Escape to close.
 */
export function SessionDetailsPanel({
  session,
  onClose,
}: {
  session: AttendanceSessionDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherAttendancePageCopy;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [session.id]);

  const percent = session.counts.attendancePercent;
  const infoRows = [
    { id: 'course', label: copy.courseLabel, value: session.course.title },
    { id: 'batch', label: copy.batchLabel, value: session.batch.name },
    { id: 'mentor', label: copy.mentorLabel, value: session.mentor.name },
    {
      id: 'session-date',
      label: copy.sessionDateLabel,
      value: formatAttendanceDate(session.sessionDate),
    },
    {
      id: 'duration',
      label: copy.durationLabel,
      value: `${String(session.durationMinutes)} min`,
    },
    {
      id: 'last-updated',
      label: copy.lastUpdatedLabel,
      value: formatAttendanceDateTime(session.updatedAt),
    },
  ];
  const summaryRows = [
    {
      id: 'total-students',
      label: copy.totalStudentsLabel,
      value: String(session.counts.totalStudents),
    },
    { id: 'present', label: copy.presentLabel, value: String(session.counts.present) },
    { id: 'absent', label: copy.absentLabel, value: String(session.counts.absent) },
    {
      id: 'attendance',
      label: copy.attendanceLabel,
      value: percent === null ? copy.notRecordedLabel : `${String(percent)}%`,
    },
  ];

  return (
    <Card
      role="region"
      aria-label={`${copy.detailsPanelLabel}: ${session.title}`}
      className="rounded-xl shadow-sm"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SessionStatusBadge status={session.status} />
          </div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold leading-snug tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {session.title}
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

      <CardContent className="grid gap-6 p-5 pt-0 laptop:grid-cols-3">
        <section className="space-y-3" aria-label={copy.detailsPanelLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.detailsPanelLabel}</h3>
          <dl className="grid gap-2 text-small">
            {infoRows.map((row) => (
              <div key={row.id} className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-right font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="space-y-3" aria-label={copy.detailsRosterLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.detailsRosterLabel}</h3>
          {session.records.length === 0 ? (
            <p className="text-small text-muted-foreground">{copy.detailsEmptyRoster}</p>
          ) : (
            <ul className="flex flex-col gap-2" aria-label={copy.detailsRosterLabel}>
              {session.records.map((record) => (
                <li
                  key={record.studentId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted/40 text-xs font-semibold text-muted-foreground"
                    >
                      {record.initials}
                    </span>
                    <span className="truncate text-small font-medium text-foreground">
                      {record.studentName}
                    </span>
                  </span>
                  <AttendanceRecordBadge status={record.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3" aria-label={copy.detailsSummaryLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.detailsSummaryLabel}</h3>
          <dl className="grid gap-2 text-small">
            {summaryRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-right font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </CardContent>
    </Card>
  );
}
