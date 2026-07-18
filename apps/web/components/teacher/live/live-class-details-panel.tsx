'use client';

import {
  TEACHER_COMING_SOON,
  formatTeacherLiveClassDateTime,
  teacherLiveClassesPageCopy,
  type TeacherLiveClassDto,
} from '../../../lib/teacher';
import { TeacherDetailList, TeacherDetailsPanel } from '../shared';
import { LiveClassStatusBadge, MeetingStatusBadge } from './live-class-badges';

/** Keyboard-accessible details panel for a selected live-class DTO. */
export function LiveClassDetailsPanel({
  session,
  onClose,
}: {
  session: TeacherLiveClassDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherLiveClassesPageCopy;

  const attendancePercent = session.attendance.attendancePercent;
  const integrationRows = Object.entries(session.integrations).map(([id]) => ({
    id,
    label:
      id === 'meetingProvisioning'
        ? 'Meeting Provisioning'
        : `${id.charAt(0).toUpperCase()}${id.slice(1)}`,
    value: TEACHER_COMING_SOON.integrationLabel,
  }));

  return (
    <TeacherDetailsPanel
      ariaLabel={`${copy.detailsPanelLabel}: ${session.title}`}
      closeLabel={copy.detailsCloseLabel}
      title={session.title}
      eyebrow={<LiveClassStatusBadge status={session.status} />}
      onClose={onClose}
      focusKey={session.id}
      contentClassName="grid gap-6 p-5 pt-0 tablet:grid-cols-2 laptop:grid-cols-3"
    >
      <section className="space-y-3" aria-label={copy.sessionInfoLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.sessionInfoLabel}</h3>
        <TeacherDetailList
          layout="inline"
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
        <TeacherDetailList
          layout="inline"
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
        <TeacherDetailList
          layout="inline"
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
        <TeacherDetailList
          layout="inline"
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
        <h3 className="text-small font-semibold text-foreground">{copy.attendanceSummaryLabel}</h3>
        <TeacherDetailList
          layout="inline"
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
        <h3 className="text-small font-semibold text-foreground">{copy.futureIntegrationsLabel}</h3>
        <TeacherDetailList layout="inline" rows={integrationRows} />
      </section>
    </TeacherDetailsPanel>
  );
}
