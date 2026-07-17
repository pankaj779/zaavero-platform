import { Card, EmptyState, PageHeader } from '@graphology/ui';

/**
 * Full-page placeholder for Teacher Portal modules that are part of the roadmap
 * but not yet implemented. Keeps the shell fully navigable without 404s.
 */
export function TeacherComingSoonPage({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />
      <Card className="rounded-xl p-2 shadow-sm">
        <EmptyState
          title="Coming Soon"
          description={`${title} is part of the Teacher Portal roadmap and will be available in a later sprint.`}
          className="border-0 bg-transparent"
        />
      </Card>
    </div>
  );
}
