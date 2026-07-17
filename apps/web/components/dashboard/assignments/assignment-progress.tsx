import { ProgressBar } from '@graphology/ui';
import type { AssignmentProgressDto } from '../../../lib/dashboard';

export function AssignmentProgress({
  progress,
}: {
  progress: AssignmentProgressDto;
}): React.JSX.Element {
  return <ProgressBar value={progress.percentage} label={progress.label} />;
}
