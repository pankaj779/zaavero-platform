'use client';

import { Button } from '@graphology/ui';
import {
  TEACHER_COMING_SOON,
  formatTeacherCalendarDateTime,
  teacherCalendarEventStatusLabel,
  teacherCalendarEventTypeLabel,
  teacherCalendarPageCopy,
  type TeacherCalendarEventDto,
} from '../../../lib/teacher';
import { TeacherDetailList, TeacherDetailsPanel } from '../shared';

/** Selected event details panel — Escape closes. */
export function CalendarEventDetails({
  event,
  onClose,
}: {
  event: TeacherCalendarEventDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherCalendarPageCopy;

  return (
    <TeacherDetailsPanel
      ariaLabel={`${copy.detailsLabel}: ${event.title}`}
      closeLabel={copy.detailsCloseLabel}
      title={event.title}
      eyebrow={
        <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
          {teacherCalendarEventTypeLabel[event.type]}
        </p>
      }
      onClose={onClose}
      focusKey={event.id}
      contentClassName="space-y-4 p-5 pt-0"
    >
      <p className="text-small text-muted-foreground">{event.description}</p>
      <TeacherDetailList
        layout="stack"
        rows={[
          { id: 'type', label: copy.typeLabel, value: teacherCalendarEventTypeLabel[event.type] },
          {
            id: 'status',
            label: copy.statusLabel,
            value: teacherCalendarEventStatusLabel[event.status],
          },
          {
            id: 'start',
            label: copy.startLabel,
            value: formatTeacherCalendarDateTime(event.startTime),
          },
          {
            id: 'end',
            label: copy.endLabel,
            value: formatTeacherCalendarDateTime(event.endTime),
          },
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
        <TeacherDetailList
          layout="stack"
          rows={[
            { id: 'google', label: 'Google Calendar', value: TEACHER_COMING_SOON.integrationLabel },
            { id: 'outlook', label: 'Outlook', value: TEACHER_COMING_SOON.integrationLabel },
            {
              id: 'meeting',
              label: 'Meeting provisioning',
              value: TEACHER_COMING_SOON.integrationLabel,
            },
            { id: 'reminders', label: 'Reminders', value: TEACHER_COMING_SOON.integrationLabel },
          ]}
        />
      </section>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        aria-label={`${copy.addReminderButton} — coming soon`}
      >
        {copy.addReminderButton}
      </Button>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </TeacherDetailsPanel>
  );
}
