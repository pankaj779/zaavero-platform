import {
  teacherBatchesPageCopy,
  type TeacherBatchSummaryDto,
  type TeacherBatchesViewMode,
} from '../../../lib/teacher';
import { BatchCard } from './batch-card';

export function BatchCollection({
  batches,
  mode,
}: {
  batches: TeacherBatchSummaryDto[];
  mode: TeacherBatchesViewMode;
}): React.JSX.Element {
  if (mode === 'list') {
    return (
      <ul className="flex flex-col gap-4" aria-label={teacherBatchesPageCopy.gridLabel}>
        {batches.map((batch) => (
          <li key={batch.id}>
            <BatchCard batch={batch} layout="list" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={teacherBatchesPageCopy.gridLabel}
    >
      {batches.map((batch) => (
        <li key={batch.id} className="h-full">
          <BatchCard batch={batch} layout="grid" />
        </li>
      ))}
    </ul>
  );
}
