import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import type { TeacherPlaceholderItemDto } from '../../../lib/teacher';
import { ComingSoonBadge } from './coming-soon-badge';

/**
 * Reusable placeholder section for the Teacher dashboard.
 * Presentational only — renders honest placeholder items with a Coming Soon marker.
 */
export function TeacherSectionCard({
  title,
  description,
  items,
  className,
}: {
  title: string;
  description: string;
  items: TeacherPlaceholderItemDto[];
  className?: string;
}): React.JSX.Element {
  return (
    <Card className={className ? `flex h-full flex-col rounded-xl shadow-sm ${className}` : 'flex h-full flex-col rounded-xl shadow-sm'}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <ComingSoonBadge />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-surface px-3 py-3">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-caption text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
