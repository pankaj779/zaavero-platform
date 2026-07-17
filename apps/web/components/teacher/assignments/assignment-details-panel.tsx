'use client';

import { useEffect, useRef } from 'react';
import { Button, Card, CardContent, CardHeader } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import {
  formatTeacherAssignmentDate,
  formatTeacherAssignmentDateTime,
  teacherAssignmentsPageCopy,
  type TeacherAssignmentDto,
} from '../../../lib/teacher';
import { AssignmentStatusBadge } from './assignment-status-badge';

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

/** Keyboard-accessible details panel for a selected assignment DTO. */
export function AssignmentDetailsPanel({
  assignment,
  onClose,
}: {
  assignment: TeacherAssignmentDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherAssignmentsPageCopy;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [assignment.id]);

  const rate = assignment.submissions.submissionRate;
  const average = assignment.grading.averageScore;
  const integrationRows = [
    { id: 'plagiarismDetection', label: 'Plagiarism Detection', value: 'Coming Soon' },
    { id: 'aiEvaluation', label: 'AI Evaluation', value: 'Coming Soon' },
    { id: 'rubricGrading', label: 'Rubric Grading', value: 'Coming Soon' },
    { id: 'notifications', label: 'Notifications', value: 'Coming Soon' },
  ];

  return (
    <Card
      role="region"
      aria-label={`${copy.detailsPanelLabel}: ${assignment.title}`}
      className="rounded-xl shadow-sm"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-5">
        <div className="min-w-0 space-y-2">
          <AssignmentStatusBadge status={assignment.status} />
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold leading-snug tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {assignment.title}
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
        <section className="space-y-3" aria-label={copy.assignmentInfoLabel}>
          <h3 className="text-small font-semibold text-foreground">{copy.assignmentInfoLabel}</h3>
          <DetailList
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
                <span className="truncate text-small font-medium text-foreground">
                  {batch.name}
                </span>
                <span className="shrink-0 text-caption text-muted-foreground">
                  {`${String(batch.studentsEnrolled)} ${copy.totalStudentsLabel.toLowerCase()}`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3" aria-label={copy.submissionSummaryLabel}>
          <h3 className="text-small font-semibold text-foreground">
            {copy.submissionSummaryLabel}
          </h3>
          <DetailList
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
          <DetailList
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
          <h3 className="text-small font-semibold text-foreground">
            {copy.futureIntegrationsLabel}
          </h3>
          <DetailList rows={integrationRows} />
        </section>
      </CardContent>
    </Card>
  );
}
