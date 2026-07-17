'use client';

import { useEffect, useRef } from 'react';
import { Button, Card, CardContent, CardHeader } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import {
  formatTeacherLiveClassDateTime,
  teacherLiveClassesPageCopy,
  type TeacherLiveClassDto,
} from '../../../lib/teacher';
import {
  LiveClassStatusBadge,
  MeetingStatusBadge,
} from './live-class-badges';

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
          className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
        >
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="text-right font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Keyboard-accessible details panel for a selected live-class DTO. */
export function LiveClassDetailsPanel({
  session,
  onClose,
}: {
  session: TeacherLiveClassDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherLiveClassesPageCopy;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [session.id]);

  const attendancePercent = session.attendance.attendancePercent;
  const integrationRows = Object.entries(session.integrations).map(([id]) => ({
    id,
    label:
      id === 'meetingProvisioning'
        ? 'Meeting Provisioning'
        : `${id.charAt(0).toUpperCase()}${id.slice(1)}`,
    value: 'Coming Soon',
  }));

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
          <LiveClassStatusBadge status={session.status} />
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

      <CardContent className="grid gap-6 p-5 pt-0 tablet:grid-cols-2 laptop:grid-cols-3">
        <section className="space-y-3" aria-label={copy.sessionInfoLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.sessionInfoLabel}</h3>
          <DetailList
            rows={[
              { id: 'title', label: 'Session Title', value: session.title },
              { id: 'course', label: copy.courseLabel, value: session.course.title },
              { id: 'mentor', label: copy.mentorLabel, value: session.mentor.name },
              {
                id: 'updated',
                label: copy.lastUpdatedLabel,
                value: formatTeacherLiveClassDateTime(session.updatedAt),
              },
            ]}
          />
        </section>

        <section className="space-y-3" aria-label={copy.batchInfoLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.batchInfoLabel}</h3>
          <DetailList
            rows={[
              { id: 'batch', label: copy.batchLabel, value: session.batch.name },
              {
                id: 'enrolled',
                label: copy.studentsEnrolledLabel,
                value: String(session.batch.studentsEnrolled),
              },
            ]}
          />
        </section>

        <section className="space-y-3" aria-label={copy.scheduleLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.scheduleLabel}</h3>
          <DetailList
            rows={[
              {
                id: 'start',
                label: copy.startsAtLabel,
                value: formatTeacherLiveClassDateTime(session.startsAt),
              },
              {
                id: 'end',
                label: copy.endsAtLabel,
                value: formatTeacherLiveClassDateTime(session.endsAt),
              },
              {
                id: 'duration',
                label: copy.durationLabel,
                value: `${String(session.durationMinutes)} min`,
              },
            ]}
          />
        </section>

        <section className="space-y-3" aria-label={copy.meetingInfoLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.meetingInfoLabel}</h3>
          <DetailList
            rows={[
              {
                id: 'provider',
                label: copy.meetingProviderLabel,
                value: session.meeting.provider,
              },
              {
                id: 'status',
                label: copy.meetingStatusLabel,
                value: <MeetingStatusBadge status={session.meeting.status} />,
              },
              {
                id: 'url',
                label: copy.meetingUrlLabel,
                value: copy.meetingUrlPending,
              },
            ]}
          />
        </section>

        <section className="space-y-3" aria-label={copy.attendanceSummaryLabel}>
          <h3 className="text-small font-semibold text-foreground">
            {copy.attendanceSummaryLabel}
          </h3>
          <DetailList
            rows={[
              {
                id: 'total',
                label: copy.totalStudentsLabel,
                value: String(session.attendance.totalStudents),
              },
              {
                id: 'present',
                label: copy.presentLabel,
                value: String(session.attendance.present),
              },
              {
                id: 'absent',
                label: copy.absentLabel,
                value: String(session.attendance.absent),
              },
              {
                id: 'rate',
                label: copy.attendanceRateLabel,
                value:
                  attendancePercent === null
                    ? copy.notRecordedLabel
                    : `${String(attendancePercent)}%`,
              },
            ]}
          />
        </section>

        <section className="space-y-3" aria-label={copy.futureIntegrationsLabel}>
          <h3 className="text-small font-semibold text-foreground">
            {copy.futureIntegrationsLabel}
          </h3>
          <DetailList rows={integrationRows} />
        </section>
      </CardContent>
    </Card>
  );
}
