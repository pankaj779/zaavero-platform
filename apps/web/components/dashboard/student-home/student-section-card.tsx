import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import type { StudentDashboardSectionItemDto } from '../../../lib/student';

export function StudentSectionCard({
  title,
  description,
  emptyLabel,
  items,
  className,
  headerExtra,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  items: StudentDashboardSectionItemDto[];
  className?: string;
  headerExtra?: React.ReactNode;
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
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {headerExtra}
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
