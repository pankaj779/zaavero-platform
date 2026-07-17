import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import {
  assignmentsPageCopy,
  formatAssignmentDate,
  type AssignmentDto,
} from '../../../lib/dashboard';
import { AssignmentStatusBadge } from './assignment-status-badge';
import { SubmissionPlaceholder } from './submission-placeholder';

export function AssignmentDetails({
  assignment,
}: {
  assignment: AssignmentDto | null;
}): React.JSX.Element {
  if (!assignment) {
    return (
      <Card className="rounded-xl shadow-sm" aria-labelledby="assignment-details-heading">
        <CardHeader>
          <CardTitle id="assignment-details-heading" className="text-base">
            {assignmentsPageCopy.detailsTitle}
          </CardTitle>
          <CardDescription>{assignmentsPageCopy.detailsEmpty}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl shadow-sm" aria-labelledby="assignment-details-heading">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <AssignmentStatusBadge status={assignment.status} />
          </div>
          <CardTitle id="assignment-details-heading" className="text-lg">
            {assignment.title}
          </CardTitle>
          <CardDescription>{assignment.courseTitle}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 text-small">
          <dl className="grid gap-3">
            <div>
              <dt className="text-caption text-muted-foreground">{assignmentsPageCopy.mentorLabel}</dt>
              <dd className="mt-1 font-medium text-foreground">{assignment.mentor.name}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">{assignmentsPageCopy.dueLabel}</dt>
              <dd className="mt-1 font-medium text-foreground">
                {formatAssignmentDate(assignment.dueDate)}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">
                {assignmentsPageCopy.durationLabel}
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                {assignment.estimatedDuration.label}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">
                {assignmentsPageCopy.attemptsLabel}
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                {assignment.allowedAttempts === null
                  ? 'Attempts placeholder'
                  : `${String(assignment.attemptsUsed)} / ${String(assignment.allowedAttempts)}`}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">{assignmentsPageCopy.marksLabel}</dt>
              <dd className="mt-1 font-medium text-foreground">{assignment.marks.label}</dd>
            </div>
          </dl>

          <div>
            <h3 className="text-caption font-medium text-muted-foreground">
              {assignmentsPageCopy.instructionsLabel}
            </h3>
            <p className="mt-2 leading-relaxed text-foreground">{assignment.instructions}</p>
          </div>

          <div>
            <h3 className="text-caption font-medium text-muted-foreground">
              {assignmentsPageCopy.requirementsLabel}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
              {assignment.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-caption font-medium text-muted-foreground">
              {assignmentsPageCopy.attachmentsLabel}
            </h3>
            {assignment.attachments.length === 0 ? (
              <p className="mt-2 text-muted-foreground">{assignmentsPageCopy.attachmentsEmpty}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {assignment.attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <p className="font-medium text-foreground">{attachment.title}</p>
                    <p className="text-caption text-muted-foreground">
                      {attachment.fileName ?? 'File name placeholder'} ·{' '}
                      {attachment.mimeTypePlaceholder}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-caption font-medium text-muted-foreground">Feedback</h3>
            <p className="mt-2 text-muted-foreground">
              {assignment.feedback.summary ?? assignmentsPageCopy.feedbackPlaceholder}
            </p>
          </div>
        </CardContent>
      </Card>

      <SubmissionPlaceholder assignment={assignment} />
    </div>
  );
}
