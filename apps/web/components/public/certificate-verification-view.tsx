'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CertificateApi, type PublicCertificateVerificationDto } from '../../lib/api';
import { brandConfig } from '../../lib/brand';
import { MediaImage } from '../shared/media-image';

export function CertificateVerificationView({
  verificationCode,
}: {
  verificationCode: string;
}): React.JSX.Element {
  const [result, setResult] = useState<PublicCertificateVerificationDto | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    void CertificateApi.verifyPublicCertificate(verificationCode)
      .then((record) => {
        if (!cancelled) setResult(record);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [verificationCode]);

  const organization = result?.organizationName ?? brandConfig.company.name;
  const valid = result?.status === 'VALID';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12">
      <Card className="w-full rounded-xl shadow-sm">
        <CardHeader className="space-y-4 text-center">
          {result?.organizationLogoUrl ? (
            <MediaImage
              src={result.organizationLogoUrl}
              alt={`${organization} logo`}
              className="mx-auto h-16 w-16 rounded-lg object-contain"
              sizes="64px"
            />
          ) : null}
          <div>
            <p className="text-small text-muted-foreground">{organization}</p>
            <CardTitle className="mt-1 text-2xl">Certificate verification</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!result && !failed ? (
            <p className="py-8 text-center text-small text-muted-foreground" role="status">
              Verifying certificate…
            </p>
          ) : null}
          {failed ? (
            <div className="space-y-2 py-8 text-center" role="alert">
              <Badge variant="danger">Unable to verify</Badge>
              <p className="text-small text-muted-foreground">
                Verification is temporarily unavailable. Please try again.
              </p>
            </div>
          ) : null}
          {result?.status === 'NOT_FOUND' ? (
            <div className="space-y-2 py-8 text-center">
              <Badge variant="neutral">Not found</Badge>
              <p className="text-small text-muted-foreground">
                No issued certificate matches this verification code.
              </p>
            </div>
          ) : null}
          {result && result.status !== 'NOT_FOUND' ? (
            <>
              <div className="text-center">
                <Badge variant={valid ? 'success' : 'danger'}>
                  {valid ? 'Valid certificate' : 'Revoked certificate'}
                </Badge>
              </div>
              <dl className="grid gap-4 rounded-lg border p-5 tablet:grid-cols-2">
                <VerificationField label="Student" value={result.studentName} />
                <VerificationField label="Course" value={result.courseName} />
                <VerificationField label="Certificate" value={result.certificateNumber} />
                <VerificationField label="Verification code" value={result.verificationCode} />
                <VerificationField label="Issued" value={formatDate(result.issuedAt)} />
                <VerificationField label="Completed" value={formatDate(result.completedAt)} />
                {result.revokedAt ? (
                  <VerificationField label="Revoked" value={formatDate(result.revokedAt)} />
                ) : null}
              </dl>
            </>
          ) : null}
          <div className="text-center">
            <Button type="button" variant="outline" asChild>
              <Link href="/">Return home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function VerificationField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value ?? '—'}</dd>
    </div>
  );
}

function formatDate(value: string | null): string | null {
  return value ? new Date(value).toLocaleDateString() : null;
}
