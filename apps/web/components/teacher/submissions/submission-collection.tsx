import {
  teacherSubmissionsPageCopy,
  type TeacherSubmissionSummaryDto,
  type TeacherSubmissionsViewMode,
} from '../../../lib/teacher';
import { SubmissionCard } from './submission-card';

export function SubmissionCollection({
  submissions,
  mode,
  selectedSubmissionId,
  onSelect,
}: {
  submissions: TeacherSubmissionSummaryDto[];
  mode: TeacherSubmissionsViewMode;
  selectedSubmissionId?: string | null;
  onSelect?: (submissionId: string) => void;
}): React.JSX.Element {
  if (mode === 'list') {
    return (
      <ul className="flex flex-col gap-4" aria-label={teacherSubmissionsPageCopy.collectionLabel}>
        {submissions.map((submission) => (
          <li key={submission.id}>
            <SubmissionCard
              submission={submission}
              layout="list"
              selected={submission.id === selectedSubmissionId}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={teacherSubmissionsPageCopy.collectionLabel}
    >
      {submissions.map((submission) => (
        <li key={submission.id} className="h-full">
          <SubmissionCard
            submission={submission}
            selected={submission.id === selectedSubmissionId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
