'use client';

import { Button, Input, Textarea } from '@graphology/ui';
import { useEffect, useState } from 'react';
import {
  formatTeacherSubmissionDate,
  formatTeacherSubmissionDateTime,
  teacherSubmissionsPageCopy,
  type TeacherSubmissionSummaryDto,
} from '../../../lib/teacher';
import { TeacherDetailList, TeacherDetailsPanel } from '../shared';
import { SubmissionStatusBadge } from './submission-status-badge';

export function SubmissionDetailsPanel({
  submission,
  onGrade,
  onClose,
}: {
  submission: TeacherSubmissionSummaryDto;
  onGrade?: (submissionId: string, score: number, feedback: string) => Promise<void>;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherSubmissionsPageCopy;
  const maxScore = submission.assignment.maxScore;
  const [score, setScore] = useState(submission.score === null ? '' : String(submission.score));
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setScore(submission.score === null ? '' : String(submission.score));
    setFeedback(submission.feedback ?? '');
    setFormError('');
    setSaved(false);
  }, [submission.feedback, submission.id, submission.score]);

  return (
    <TeacherDetailsPanel
      ariaLabel={`${copy.detailsPanelLabel}: ${submission.assignment.title}`}
      closeLabel={copy.detailsCloseLabel}
      title={submission.assignment.title}
      eyebrow={<SubmissionStatusBadge status={submission.status} />}
      onClose={onClose}
      focusKey={submission.id}
      contentClassName="grid gap-6 p-5 pt-0 tablet:grid-cols-2 laptop:grid-cols-3"
    >
      <section className="space-y-3" aria-label={copy.submissionInfoLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.submissionInfoLabel}</h3>
        <TeacherDetailList
          layout="inline"
          rows={[
            { id: 'student', label: copy.studentLabel, value: submission.student.fullName },
            { id: 'assignment', label: copy.assignmentLabel, value: submission.assignment.title },
            { id: 'course', label: copy.courseLabel, value: submission.assignment.course.title },
            {
              id: 'submitted',
              label: copy.submittedAtLabel,
              value:
                submission.submittedAt === null
                  ? copy.notSubmittedLabel
                  : formatTeacherSubmissionDateTime(submission.submittedAt),
            },
            {
              id: 'updated',
              label: copy.lastUpdatedLabel,
              value: formatTeacherSubmissionDate(submission.updatedAt),
            },
          ]}
        />
      </section>

      <section className="space-y-3" aria-label={copy.gradingLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.gradingLabel}</h3>
        <TeacherDetailList
          layout="inline"
          rows={[
            {
              id: 'score',
              label: copy.scoreLabel,
              value: submission.score === null ? copy.noScoreLabel : String(submission.score),
            },
            {
              id: 'max',
              label: copy.maxScoreLabel,
              value: maxScore === null ? copy.noScoreLabel : String(maxScore),
            },
            {
              id: 'graded',
              label: copy.gradedAtLabel,
              value:
                submission.gradedAt === null
                  ? copy.notGradedLabel
                  : formatTeacherSubmissionDateTime(submission.gradedAt),
            },
            {
              id: 'grader',
              label: copy.graderLabel,
              value: submission.grader?.name ?? copy.notGradedLabel,
            },
            {
              id: 'feedback',
              label: copy.feedbackLabel,
              value: submission.feedback?.trim() ? submission.feedback : copy.notGradedLabel,
            },
          ]}
        />
        {onGrade ? (
          <form
            className="space-y-3 rounded-lg border border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              const numericScore = Number(score);
              if (
                score.trim().length === 0 ||
                !Number.isFinite(numericScore) ||
                numericScore < 0 ||
                (maxScore !== null && numericScore > maxScore)
              ) {
                setFormError(
                  maxScore === null
                    ? 'Enter a valid score of zero or greater.'
                    : `Enter a score from 0 to ${String(maxScore)}.`,
                );
                return;
              }
              setSaving(true);
              setFormError('');
              setSaved(false);
              void onGrade(submission.id, numericScore, feedback.trim())
                .then(() => {
                  setSaved(true);
                })
                .catch(() => {
                  setFormError('Unable to save this grade. Please try again.');
                })
                .finally(() => {
                  setSaving(false);
                });
            }}
          >
            <div className="space-y-1">
              <label
                htmlFor={`submission-score-${submission.id}`}
                className="text-caption font-medium"
              >
                {copy.scoreLabel}
              </label>
              <Input
                id={`submission-score-${submission.id}`}
                type="number"
                min={0}
                max={maxScore ?? undefined}
                step="any"
                required
                value={score}
                disabled={saving}
                onChange={(event) => {
                  setScore(event.target.value);
                  setSaved(false);
                }}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor={`submission-feedback-${submission.id}`}
                className="text-caption font-medium"
              >
                {copy.feedbackLabel}
              </label>
              <Textarea
                id={`submission-feedback-${submission.id}`}
                rows={4}
                value={feedback}
                disabled={saving}
                onChange={(event) => {
                  setFeedback(event.target.value);
                  setSaved(false);
                }}
              />
            </div>
            {formError.length > 0 ? (
              <p className="text-caption text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            {saved ? (
              <p className="text-caption text-muted-foreground" role="status">
                Grade saved.
              </p>
            ) : null}
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving…' : 'Save grade'}
            </Button>
          </form>
        ) : null}
      </section>

      <section className="space-y-3" aria-label={copy.contentLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.contentLabel}</h3>
        <p className="whitespace-pre-wrap text-small text-foreground">
          {submission.content?.trim() ? submission.content : copy.emptyContentLabel}
        </p>
      </section>

      <section className="space-y-3" aria-label={copy.attachmentsLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.attachmentsLabel}</h3>
        {submission.attachments.length === 0 ? (
          <p className="text-caption text-muted-foreground">{copy.attachmentsPlaceholder}</p>
        ) : (
          <ul className="flex flex-col gap-2" aria-label={copy.attachmentsLabel}>
            {submission.attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="truncate text-small font-medium text-foreground">
                  {attachment.label}
                </span>
                <span className="shrink-0 text-caption text-muted-foreground">
                  {attachment.kind}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-caption text-muted-foreground">{copy.attachmentsPlaceholder}</p>
      </section>
    </TeacherDetailsPanel>
  );
}
