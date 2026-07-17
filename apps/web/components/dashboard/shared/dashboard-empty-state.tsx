import { Card, EmptyState } from '@graphology/ui';

export function DashboardEmptyState({
  title,
  description,
  illustration,
}: {
  title: string;
  description: string;
  illustration: React.ReactNode;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl p-2 shadow-sm">
      <EmptyState
        className="border-0 bg-transparent"
        title={title}
        description={description}
        illustration={illustration}
      />
    </Card>
  );
}
