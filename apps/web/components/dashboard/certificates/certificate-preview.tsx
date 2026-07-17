import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import {
  certificatesPageCopy,
  formatCertificateDate,
  type CertificateDto,
} from '../../../lib/dashboard';
import { CertificateStatusBadge } from './certificate-status-badge';

const AwardIcon = icons.award;

export function CertificatePreview({
  certificate,
}: {
  certificate: CertificateDto | null;
}): React.JSX.Element {
  if (!certificate) {
    return (
      <Card className="rounded-xl shadow-sm" aria-labelledby="certificate-preview-heading">
        <CardHeader>
          <CardTitle id="certificate-preview-heading" className="text-base">
            {certificatesPageCopy.previewTitle}
          </CardTitle>
          <CardDescription>{certificatesPageCopy.detailsEmpty}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="certificate-preview-heading">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CertificateStatusBadge status={certificate.status} />
        </div>
        <CardTitle id="certificate-preview-heading" className="text-base">
          {certificatesPageCopy.previewTitle}
        </CardTitle>
        <CardDescription>{certificate.courseTitle}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-gradient-to-b from-muted/70 to-surface px-6 py-8 text-center"
          role="img"
          aria-label={certificatesPageCopy.previewTitle}
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm">
            <AwardIcon className="h-6 w-6 text-foreground" aria-hidden />
          </span>
          <p className="max-w-sm text-small leading-relaxed text-muted-foreground">
            {certificatesPageCopy.previewMessage}
          </p>
        </div>

        <dl className="grid gap-3 text-small">
          <div>
            <dt className="text-caption text-muted-foreground">{certificatesPageCopy.numberLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {certificate.certificateNumber ?? certificatesPageCopy.numberPlaceholder}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">
              {certificatesPageCopy.completionLabel}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatCertificateDate(certificate.completionDate)}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{certificatesPageCopy.issueLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatCertificateDate(certificate.issueDate)}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{certificatesPageCopy.mentorLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{certificate.mentor.name}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
