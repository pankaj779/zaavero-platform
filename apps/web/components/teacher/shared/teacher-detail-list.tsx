import { cn } from '@graphology/utils';

export type TeacherDetailListLayout = 'stack' | 'inline';

export interface TeacherDetailListRow {
  id: string;
  label: string;
  value: React.ReactNode;
}

/** Shared definition list used in teacher details panels. */
export function TeacherDetailList({
  rows,
  layout = 'stack',
}: {
  rows: TeacherDetailListRow[];
  layout?: TeacherDetailListLayout;
}): React.JSX.Element {
  return (
    <dl className="grid gap-2 text-small">
      {rows.map((row) => (
        <div
          key={row.id}
          className={cn(
            'rounded-lg border border-border bg-surface px-3 py-2',
            layout === 'inline' ? 'flex items-start justify-between gap-3' : 'flex flex-col gap-1',
          )}
        >
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd
            className={cn('font-medium text-foreground', layout === 'inline' ? 'text-right' : '')}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
