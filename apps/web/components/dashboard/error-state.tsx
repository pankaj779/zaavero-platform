import { Card, EmptyState } from '@graphology/ui';
import { icons } from '../../lib/constants';

const AlertIcon = icons.alert;

export function ErrorState({
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
  return (
    <Card className="rounded-xl p-2 shadow-sm">
      <EmptyState
        className="border-0 bg-transparent"
        title={title}
        description={description}
        illustration={<AlertIcon className="h-7 w-7" aria-hidden />}
        actionLabel={onRetry ? retryLabel : undefined}
        onAction={onRetry}
      />
      {onRetry ? (
        <p className="sr-only">Retry is a placeholder until backend integration.</p>
      ) : null}
    </Card>
  );
}
