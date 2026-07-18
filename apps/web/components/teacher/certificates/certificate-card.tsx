import { Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  formatTeacherCertificateDate,
  teacherCertificatesPageCopy,
  type StudentCertificateDto,
} from '../../../lib/teacher';
import { teacherCardSurfaceClass } from '../shared';
import { CertificateStatusBadge } from './certificate-status-badge';

export function CertificateCard({
  certificate,
  selected = false,
  onSelect,
}: {
  certificate: StudentCertificateDto;
  selected?: boolean;
  onSelect?: (certificateId: string) => void;
}): React.JSX.Element {
  const copy = teacherCertificatesPageCopy;

  return (
    <Card
      className={cn(teacherCardSurfaceClass, selected ? 'ring-2 ring-primary ring-offset-2' : '')}
    >
      <CardHeader className="space-y-2 p-4 pb-0">
        <CertificateStatusBadge status={certificate.status} />
        <CardTitle className="text-base leading-snug">{certificate.student.name}</CardTitle>
        <p className="text-small text-muted-foreground">{certificate.course.title}</p>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <dl className="grid gap-2 text-small">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">{copy.batchLabel}</dt>
            <dd className="text-right font-medium text-foreground">{certificate.batch.name}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">{copy.issuedAtLabel}</dt>
            <dd className="text-right font-medium text-foreground">
              {certificate.issuedAt === null
                ? copy.notIssuedLabel
                : formatTeacherCertificateDate(certificate.issuedAt)}
            </dd>
          </div>
        </dl>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          aria-pressed={selected}
          aria-label={`Open certificate for ${certificate.student.name}`}
          onClick={() => {
            onSelect?.(certificate.id);
          }}
        >
          View details
        </Button>
      </CardContent>
    </Card>
  );
}
