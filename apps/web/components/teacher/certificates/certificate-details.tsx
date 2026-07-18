'use client';

import { Button } from '@graphology/ui';
import {
  TEACHER_COMING_SOON,
  formatTeacherCertificateDate,
  teacherCertificateStatusLabel,
  teacherCertificatesPageCopy,
  type StudentCertificateDto,
} from '../../../lib/teacher';
import { TeacherDetailList, TeacherDetailsPanel } from '../shared';
import { CertificateStatusBadge } from './certificate-status-badge';

/** Selected certificate details — Escape closes. */
export function CertificateDetails({
  certificate,
  onClose,
}: {
  certificate: StudentCertificateDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherCertificatesPageCopy;

  return (
    <TeacherDetailsPanel
      ariaLabel={`${copy.detailsLabel}: ${certificate.student.name}`}
      closeLabel={copy.detailsCloseLabel}
      title={certificate.student.name}
      eyebrow={<CertificateStatusBadge status={certificate.status} />}
      subtitle={<p className="text-small text-muted-foreground">{certificate.course.title}</p>}
      onClose={onClose}
      focusKey={certificate.id}
      contentClassName="space-y-4 p-5 pt-0"
    >
      <TeacherDetailList
        layout="stack"
        rows={[
          { id: 'student', label: copy.studentLabel, value: certificate.student.name },
          { id: 'email', label: copy.emailLabel, value: certificate.student.email },
          { id: 'course', label: copy.courseLabel, value: certificate.course.title },
          { id: 'batch', label: copy.batchLabel, value: certificate.batch.name },
          {
            id: 'status',
            label: copy.statusLabel,
            value: teacherCertificateStatusLabel[certificate.status],
          },
          {
            id: 'issued',
            label: copy.issuedAtLabel,
            value:
              certificate.issuedAt === null
                ? copy.notIssuedLabel
                : formatTeacherCertificateDate(certificate.issuedAt),
          },
          {
            id: 'number',
            label: copy.certificateNumberLabel,
            value: certificate.certificateNumber ?? copy.noNumberLabel,
          },
          { id: 'mentor', label: copy.mentorLabel, value: certificate.mentor.name },
          { id: 'download', label: copy.downloadUrlLabel, value: copy.urlPending },
          { id: 'verify', label: copy.verificationUrlLabel, value: copy.urlPending },
        ]}
      />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          aria-label={`${copy.issueButton} — ${copy.comingSoonNote}`}
        >
          {copy.issueButton}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          aria-label={`${copy.downloadButton} — ${copy.comingSoonNote}`}
        >
          {copy.downloadButton}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          aria-label={`${copy.verifyButton} — ${copy.comingSoonNote}`}
        >
          {copy.verifyButton}
        </Button>
        <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
      </div>

      <section className="space-y-2" aria-label={copy.futureFeaturesLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.futureFeaturesLabel}</h3>
        <TeacherDetailList
          layout="stack"
          rows={[
            { id: 'pdf', label: 'PDF generation', value: TEACHER_COMING_SOON.integrationLabel },
            { id: 'qr', label: 'QR generation', value: TEACHER_COMING_SOON.integrationLabel },
            {
              id: 'blockchain',
              label: 'Blockchain verification',
              value: TEACHER_COMING_SOON.integrationLabel,
            },
            { id: 'email', label: 'Email delivery', value: TEACHER_COMING_SOON.integrationLabel },
            { id: 'downloads', label: 'Downloads', value: TEACHER_COMING_SOON.integrationLabel },
          ]}
        />
      </section>
    </TeacherDetailsPanel>
  );
}
