import { Badge, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { type CertificateTemplateDto } from '../../../lib/teacher';

const templateStatusVariant: Record<
  CertificateTemplateDto['status'],
  'success' | 'warning' | 'neutral'
> = {
  active: 'success',
  draft: 'warning',
  archived: 'neutral',
};

export function CertificateTemplateCard({
  template,
}: {
  template: CertificateTemplateDto;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="space-y-2 p-4 pb-0">
        <Badge variant={templateStatusVariant[template.status]}>
          {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
        </Badge>
        <CardTitle className="text-small leading-snug">{template.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        <p className="text-caption text-muted-foreground">
          {template.courseTitle ?? 'All courses'}
        </p>
        <p className="text-caption text-muted-foreground">{template.description}</p>
      </CardContent>
    </Card>
  );
}
