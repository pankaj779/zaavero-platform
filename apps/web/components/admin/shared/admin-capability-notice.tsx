import { Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';

export function AdminCapabilityNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl border-dashed shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-small text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
