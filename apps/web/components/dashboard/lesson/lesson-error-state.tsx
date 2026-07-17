import { ErrorState } from '../error-state';
import { lessonPlayerCopy } from '../../../lib/dashboard';

export function LessonErrorState(): React.JSX.Element {
  return (
    <ErrorState
      title={lessonPlayerCopy.errorTitle}
      description={lessonPlayerCopy.errorDescription}
    />
  );
}
