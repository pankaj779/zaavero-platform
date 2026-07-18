'use client';

import {
  TEACHER_COMING_SOON,
  formatTeacherAssignmentDate,
  formatTeacherAssignmentDateTime,
  teacherAssignmentsPageCopy,
  type TeacherAssignmentDto,
} from '../../../lib/teacher';
import { TeacherDetailList, TeacherDetailsPanel } from '../shared';
import { AssignmentStatusBadge } from './assignment-status-badge';

/** Keyboard-accessible details panel for a selected assignment DTO. */
export function AssignmentDetailsPanel({
  assignment,
  onClose,
}: {
  assignment: TeacherAssignmentDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherAssignmentsPageCopy;

  const rate = assignment.submissions.submissionRate;
  const average = assignment.grading.averageScore;
  const integrationRows = [
    {
      id: 'plagiarismDetection',
      label: 'Plagiarism Detection',
      value: TEACHER_COMING_SOON.integrationLabel,
    },
    {
      id: 'aiEvaluation',
      label: 'AI Evaluation',
      value: TEACHER_COMING_SOON.integrationLabel,
    },
    {
      id: 'rubricGrading',
      label: 'Rubric Grading',
      value: TEACHER_COMING_SOON.integrationLabel,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      value: TEACHER_COMING_SOON.integrationLabel,
    },
  ];

  return (
    <TeacherDetailsPanel
      ariaLabel={`${copy.detailsPanelLabel}: ${assignment.title}`}
      closeLabel={copy.detailsCloseLabel}
      title={assignment.title}
      eyebrow={<AssignmentStatusBadge status={assignment.status} />}
      onClose={onClose}
      focusKey={assignment.id}
      contentClassName="grid gap-6 p-5 pt-0 tablet:grid-cols-2 laptop:grid-cols-3"
    >
      <section className="space-y-3" aria-label={copy.assignmentInfoLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.assignmentInfoLabel}</h3>
        <TeacherDetailList
          layout="inline"
          rows={[
            { id: 'title', label: 'Assignment Title', value: assignment.title },
            { id: 'course', label: copy.courseLabel, value: assignment.course.title },
            {
              id: 'due',
              label: copy.dueDateLabel,
              value:
                assignment.dueAt === null
                  ? copy.noDueDateLabel
                  : formatTeacherAssignmentDate(assignment.dueAt),
            },
            {
              id: 'updated',
              label: copy.lastUpdatedLabel,
              value: formatTeacherAssignmentDate(assignment.updatedAt),
            },
          ]}
        />
      </section>

      <section className="space-y-3" aria-label={copy.batchListLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.batchListLabel}</h3>
        <ul className="flex flex-col gap-2" aria-label={copy.batchListLabel}>
          {assignment.batches.map((batch) => (
            <li
              key={batch.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <span className="truncate text-small font-medium text-foreground">{batch.name}</span>
              <span className="shrink-0 text-caption text-muted-foreground">
                {`${String(batch.studentsEnrolled)} ${copy.totalStudentsLabel.toLowerCase()}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-label={copy.submissionSummaryLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.submissionSummaryLabel}</h3>
        <TeacherDetailList
          layout="inline"
          rows={[
            {
              id: 'total',
              label: copy.totalStudentsLabel,
              value: String(assignment.submissions.totalStudents),
            },
            {
              id: 'submitted',
              label: copy.submittedLabel,
              value: String(assignment.submissions.submitted),
            },
            {
              id: 'pending',
              label: copy.pendingLabel,
              value: String(assignment.submissions.pending),
            },
            {
              id: 'rate',
              label: copy.submissionRateLabel,
              value: rate === null ? copy.notRecordedLabel : `${String(rate)}%`,
            },
          ]}
        />
      </section>

      <section className="space-y-3" aria-label={copy.gradingSummaryLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.gradingSummaryLabel}</h3>
        <TeacherDetailList
          layout="inline"
          rows={[
            { id: 'graded', label: copy.gradedLabel, value: String(assignment.grading.graded) },
            {
              id: 'awaiting',
              label: copy.awaitingReviewLabel,
              value: String(assignment.grading.awaitingReview),
            },
            {
              id: 'average',
              label: copy.averageScoreLabel,
              value: average === null ? copy.notRecordedLabel : String(average),
            },
            {
              id: 'max',
              label: copy.maxScoreLabel,
              value: String(assignment.grading.maxScore),
            },
          ]}
        />
      </section>

      <section className="space-y-3" aria-label={copy.timelineLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.timelineLabel}</h3>
        <ol className="flex flex-col gap-2" aria-label={copy.timelineLabel}>
          {assignment.timeline.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <span className="text-small font-medium text-foreground">{event.label}</span>
              <span className="shrink-0 text-caption text-muted-foreground">
                {formatTeacherAssignmentDateTime(event.at)}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-caption text-muted-foreground">{copy.attachmentsPlaceholder}</p>
      </section>

      <section className="space-y-3" aria-label={copy.futureIntegrationsLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.futureIntegrationsLabel}</h3>
        <TeacherDetailList layout="inline" rows={integrationRows} />
      </section>
    </TeacherDetailsPanel>
  );
}
