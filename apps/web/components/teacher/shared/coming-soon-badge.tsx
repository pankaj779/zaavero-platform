import { Badge } from '@graphology/ui';

export function ComingSoonBadge({ label = 'Coming Soon' }: { label?: string }): React.JSX.Element {
  return (
    <Badge variant="secondary" className="shrink-0">
      {label}
    </Badge>
  );
}
