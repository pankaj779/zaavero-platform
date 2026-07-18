'use client';

import { Button } from '@graphology/ui';
import { ErrorState } from '../../dashboard/error-state';

/** Shared error state for Teacher Portal module views. */
export function TeacherModuleErrorState({
  title,
  description,
  retryLabel = 'Retry',
  onRetry,
}: {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}): React.JSX.Element {
  const retry =
    onRetry ??
    (() => {
      window.location.reload();
    });

  return (
    <div className="space-y-4">
      <ErrorState title={title} description={description} />
      <div className="flex justify-center">
        <Button type="button" variant="outline" onClick={retry}>
          {retryLabel}
        </Button>
      </div>
    </div>
  );
}
