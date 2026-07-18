import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import type { TeacherDashboardItemDto } from '../../../lib/teacher';

/** Reusable live-data section for the Teacher dashboard. */
export function TeacherSectionCard({
  title,
  description,
  emptyLabel,
  items,
  className,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  items: TeacherDashboardItemDto[];
  className?: string;
}): React.JSX.Element {
  return (
    <Card
      className={
        className
          ? `flex h-full flex-col rounded-xl shadow-sm ${className}`
          : 'flex h-full flex-col rounded-xl shadow-sm'
      }
    >
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {items.length === 0 ? (
          <p className="text-small text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-lg border border-border bg-surface px-3 py-3">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-caption text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
