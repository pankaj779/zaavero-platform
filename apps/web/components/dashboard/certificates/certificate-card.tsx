import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@graphology/ui';
import {
  certificatesPageCopy,
  formatCertificateDate,
  type CertificateDto,
} from '../../../lib/dashboard';
import { CertificateStatusBadge } from './certificate-status-badge';

export function CertificateCard({
  certificate,
  selected = false,
  onSelect,
}: {
  certificate: CertificateDto;
  selected?: boolean;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  return (
    <Card
      className={
        selected
          ? 'flex h-full flex-col rounded-xl shadow-sm ring-2 ring-ring'
          : 'flex h-full flex-col rounded-xl shadow-sm transition-shadow duration-200 motion-reduce:transition-none hover:shadow-md'
      }
    >
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <CertificateStatusBadge status={certificate.status} />
          <Badge variant="neutral">{certificatesPageCopy.comingSoon}</Badge>
        </div>
        <CardTitle className="text-base leading-snug">{certificate.courseTitle}</CardTitle>
        <CardDescription>
          {certificatesPageCopy.numberLabel}:{' '}
          {certificate.certificateNumber ?? certificatesPageCopy.numberPlaceholder}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2 text-small text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">
            {certificatesPageCopy.completionLabel}:{' '}
          </span>
          {formatCertificateDate(certificate.completionDate)}
        </p>
        <p>
          <span className="font-medium text-foreground">{certificatesPageCopy.mentorLabel}: </span>
          {certificate.mentor.name}
        </p>
        <p>
          <span className="font-medium text-foreground">{certificatesPageCopy.gradeLabel}: </span>
          {certificate.grade ?? certificatesPageCopy.gradePlaceholder}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Button
          type="button"
          variant={selected ? 'primary' : 'outline'}
          size="md"
          className="w-full"
          disabled
          aria-label={`${certificatesPageCopy.viewCertificate} — ${certificatesPageCopy.comingSoon}`}
        >
          {certificatesPageCopy.viewCertificate}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="w-full"
          disabled
          aria-label={`${certificatesPageCopy.downloadPdf} — ${certificatesPageCopy.comingSoon}`}
        >
          {certificatesPageCopy.downloadPdf}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          aria-pressed={selected}
          onClick={() => {
            onSelect(certificate.id);
          }}
        >
          Preview status
        </Button>
      </CardFooter>
    </Card>
  );
}
