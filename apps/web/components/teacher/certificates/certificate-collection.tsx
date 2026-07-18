import { teacherCertificatesPageCopy, type StudentCertificateDto } from '../../../lib/teacher';
import { CertificateCard } from './certificate-card';

export function CertificateCollection({
  certificates,
  selectedCertificateId,
  onSelect,
}: {
  certificates: StudentCertificateDto[];
  selectedCertificateId: string | null;
  onSelect: (certificateId: string) => void;
}): React.JSX.Element {
  return (
    <section className="space-y-3" aria-label={teacherCertificatesPageCopy.collectionLabel}>
      <h3 className="text-small font-semibold text-foreground">
        {teacherCertificatesPageCopy.collectionLabel}
      </h3>
      <ul className="flex flex-col gap-3">
        {certificates.map((certificate) => (
          <li key={certificate.id}>
            <CertificateCard
              certificate={certificate}
              selected={certificate.id === selectedCertificateId}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
