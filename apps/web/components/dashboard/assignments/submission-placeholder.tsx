import { Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import {
  assignmentSubmissionStatusLabel,
  assignmentsPageCopy,
  type AssignmentDto,
} from '../../../lib/dashboard';

export function SubmissionPlaceholder({
  assignment,
}: {
  assignment: AssignmentDto;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="submission-placeholder-heading">
      <CardHeader className="space-y-2">
        <CardTitle id="submission-placeholder-heading" className="text-base">
          {assignmentsPageCopy.submissionTitle}
        </CardTitle>
        <p className="text-small text-muted-foreground">
          <span className="font-medium text-foreground">
            {assignmentsPageCopy.submissionStatusLabel}:{' '}
          </span>
          {assignmentSubmissionStatusLabel[assignment.submissionStatus]}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className="flex min-h-[8rem] items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 text-center text-small text-muted-foreground"
          role="img"
          aria-label={assignmentsPageCopy.uploadPlaceholder}
        >
          {assignmentsPageCopy.uploadPlaceholder}
        </div>
        <ul className="space-y-1 text-caption text-muted-foreground">
          <li>{assignmentsPageCopy.acceptedFormats}</li>
          <li>{assignmentsPageCopy.maxSize}</li>
        </ul>
        <Button type="button" variant="primary" size="md" className="w-full" disabled>
          {assignmentsPageCopy.submitComingSoon}
        </Button>
      </CardContent>
    </Card>
  );
}
