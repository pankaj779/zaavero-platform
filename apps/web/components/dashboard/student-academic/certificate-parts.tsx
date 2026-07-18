'use client';

import { useEffect, useId, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@graphology/ui';
import { cn } from '@graphology/utils';
import type { StudentCertificateDto } from '../../../lib/student';
import { formatTeacherCertificateDate, teacherCertificateStatusLabel } from '../../../lib/teacher';
import {
  TeacherDetailList,
  TeacherDetailsPanel,
  teacherCardSurfaceClass,
} from '../../teacher/shared';
import { DashboardSearch, DashboardStatGrid, DashboardStatusSortFilters } from '../shared';
import { canDownloadCertificatePdf, canShowCertificateQr } from './capabilities';
import { studentCertificatesPageCopy } from './copy';
import type { StudentCertificateSortOption, StudentCertificateStatusFilter } from './filters';
import { StudentModuleEmptyState } from './shared';

const statusOptions: { value: StudentCertificateStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'issued', label: 'Issued' },
  { value: 'pending', label: 'Pending' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'revoked', label: 'Revoked' },
];

const sortOptions: { value: StudentCertificateSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'course', label: 'Course' },
  { value: 'status', label: 'Status' },
];

const statusVariant: Record<
  StudentCertificateDto['status'],
  'success' | 'warning' | 'secondary' | 'neutral'
> = {
  issued: 'success',
  pending: 'warning',
  eligible: 'secondary',
  revoked: 'neutral',
};

export function StudentCertificateStats({
  stats,
}: {
  stats: { id: string; label: string; value: string; helper: string }[];
}): React.JSX.Element {
  return <DashboardStatGrid stats={stats} ariaLabel="Certificate statistics" />;
}

export function StudentCertificateFilters({
  query,
  status,
  sort,
  courseId,
  courseOptions,
  onQueryChange,
  onStatusChange,
  onSortChange,
  onCourseChange,
}: {
  query: string;
  status: StudentCertificateStatusFilter;
  sort: StudentCertificateSortOption;
  courseId: string;
  courseOptions: readonly { value: string; label: string }[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: StudentCertificateStatusFilter) => void;
  onSortChange: (value: StudentCertificateSortOption) => void;
  onCourseChange: (value: string) => void;
}): React.JSX.Element {
  const copy = studentCertificatesPageCopy;
  const statusSelectId = useId();
  const sortSelectId = useId();
  const courseSelectId = useId();

  return (
    <section className="space-y-4" aria-label="Certificate filters">
      <div className="flex flex-col gap-3 laptop:flex-row laptop:flex-wrap laptop:items-center">
        <div className="w-full laptop:max-w-sm">
          <DashboardSearch
            value={query}
            onChange={onQueryChange}
            placeholder={copy.searchPlaceholder}
            ariaLabel={copy.searchLabel}
          />
        </div>
        <div className="w-full tablet:max-w-[14rem]">
          <label className="sr-only" htmlFor={courseSelectId}>
            {copy.courseFilterLabel}
          </label>
          <Select value={courseId} onValueChange={onCourseChange}>
            <SelectTrigger id={courseSelectId} aria-label={copy.courseFilterLabel}>
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              {courseOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DashboardStatusSortFilters
          status={status}
          sort={sort}
          statusOptions={statusOptions}
          sortOptions={sortOptions}
          statusFilterLabel={copy.statusFilterLabel}
          sortLabel={copy.sortLabel}
          statusSelectId={statusSelectId}
          sortSelectId={sortSelectId}
          onStatusChange={onStatusChange}
          onSortChange={onSortChange}
        />
      </div>
    </section>
  );
}

export function StudentCertificateCard({
  certificate,
  selected,
  onSelect,
}: {
  certificate: StudentCertificateDto;
  selected: boolean;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  const copy = studentCertificatesPageCopy;

  return (
    <Card
      className={cn(
        'flex h-full flex-col',
        teacherCardSurfaceClass,
        selected ? 'ring-2 ring-primary ring-offset-2' : '',
      )}
    >
      <CardHeader className="space-y-2 p-5 pb-0">
        <Badge variant={statusVariant[certificate.status]}>
          {teacherCertificateStatusLabel[certificate.status]}
        </Badge>
        <CardTitle className="text-base leading-snug">{certificate.course.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <dl className="grid gap-2 text-small">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Batch</dt>
            <dd className="text-right font-medium">{certificate.batch.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Issued</dt>
            <dd className="text-right font-medium">
              {formatTeacherCertificateDate(certificate.issuedAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Number</dt>
            <dd className="text-right font-medium">{certificate.certificateNumber ?? '—'}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => {
            onSelect(certificate.id);
          }}
        >
          {copy.detailsButton}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function StudentCertificateDetails({
  certificate,
  onClose,
  onVerify,
}: {
  certificate: StudentCertificateDto;
  onClose: () => void;
  onVerify: (verificationCode: string) => Promise<StudentCertificateDto>;
}): React.JSX.Element {
  const copy = studentCertificatesPageCopy;
  const codeId = useId();
  const canDownload = canDownloadCertificatePdf(certificate);
  const canShowQr = canShowCertificateQr(certificate);
  const downloadUrl = certificate.downloadUrl;

  const [code, setCode] = useState(certificate.certificateNumber ?? '');
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    setCode(certificate.certificateNumber ?? '');
    setVerifyMessage(null);
    setVerifyError(null);
  }, [certificate.certificateNumber, certificate.id]);

  return (
    <TeacherDetailsPanel
      ariaLabel={`Certificate details: ${certificate.course.title}`}
      closeLabel={copy.detailsCloseLabel}
      title={certificate.course.title}
      eyebrow={
        <Badge variant={statusVariant[certificate.status]}>
          {teacherCertificateStatusLabel[certificate.status]}
        </Badge>
      }
      onClose={onClose}
      focusKey={certificate.id}
      contentClassName="grid gap-6 p-5 pt-0 tablet:grid-cols-2"
    >
      <TeacherDetailList
        layout="stack"
        rows={[
          { id: 'course', label: 'Course', value: certificate.course.title },
          { id: 'batch', label: 'Batch', value: certificate.batch.name },
          {
            id: 'status',
            label: 'Status',
            value: teacherCertificateStatusLabel[certificate.status],
          },
          {
            id: 'issued',
            label: 'Issued',
            value: formatTeacherCertificateDate(certificate.issuedAt),
          },
          {
            id: 'number',
            label: 'Certificate number',
            value: certificate.certificateNumber ?? '—',
          },
          { id: 'mentor', label: 'Mentor', value: certificate.mentor.name },
        ]}
      />

      <div className="space-y-4">
        <section className="space-y-2" aria-label="Download and QR">
          {canDownload && downloadUrl ? (
            <Button type="button" size="sm" asChild>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                {copy.downloadButton}
              </a>
            </Button>
          ) : (
            <Button type="button" size="sm" disabled aria-label={copy.downloadUnavailable}>
              {copy.downloadButton}
            </Button>
          )}
          <p className="text-caption text-muted-foreground">
            {canDownload ? null : copy.downloadUnavailable}
          </p>
          <p className="text-caption text-muted-foreground">
            {canShowQr ? null : copy.qrUnavailable}
          </p>
          {canShowQr && certificate.qrImageUrl ? (
            <img
              src={certificate.qrImageUrl}
              alt="Certificate QR code"
              className="h-28 w-28 rounded-md border border-border object-contain"
              loading="lazy"
            />
          ) : null}
        </section>

        <section className="space-y-3" aria-label="Certificate verification">
          <Label htmlFor={codeId}>{copy.verificationCodeLabel}</Label>
          <Input
            id={codeId}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setVerifyMessage(null);
              setVerifyError(null);
            }}
            autoComplete="off"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={verifying || code.trim().length === 0}
            onClick={() => {
              void (async () => {
                setVerifying(true);
                setVerifyMessage(null);
                setVerifyError(null);
                try {
                  const verified = await onVerify(code.trim());
                  setVerifyMessage(
                    `${copy.verifySuccess}: ${verified.certificateNumber ?? verified.course.title}`,
                  );
                } catch {
                  setVerifyError(copy.verifyFailure);
                } finally {
                  setVerifying(false);
                }
              })();
            }}
          >
            {verifying ? copy.verifyingLabel : copy.verifyButton}
          </Button>
          {verifyMessage ? (
            <p className="text-caption text-success" role="status">
              {verifyMessage}
            </p>
          ) : null}
          {verifyError ? (
            <p className="text-caption text-destructive" role="alert">
              {verifyError}
            </p>
          ) : null}
        </section>
      </div>
    </TeacherDetailsPanel>
  );
}

export function StudentCertificateCollection({
  certificates,
  selectedId,
  onSelect,
}: {
  certificates: StudentCertificateDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  const copy = studentCertificatesPageCopy;
  if (certificates.length === 0) {
    return (
      <StudentModuleEmptyState
        title={copy.noMatchesTitle}
        description={copy.noMatchesDescription}
      />
    );
  }

  return (
    <ul
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={copy.collectionLabel}
    >
      {certificates.map((certificate) => (
        <li key={certificate.id}>
          <StudentCertificateCard
            certificate={certificate}
            selected={selectedId === certificate.id}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
