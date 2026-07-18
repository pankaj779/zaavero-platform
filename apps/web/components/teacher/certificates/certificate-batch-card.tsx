import { Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { teacherCertificatesPageCopy, type CertificateBatchDto } from '../../../lib/teacher';

export function CertificateBatchCard({ batch }: { batch: CertificateBatchDto }): React.JSX.Element {
  const copy = teacherCertificatesPageCopy;
  const counts = [
    { id: 'eligible', label: copy.eligibleLabel, value: batch.eligibleCount },
    { id: 'pending', label: copy.pendingLabel, value: batch.pendingCount },
    { id: 'issued', label: copy.issuedLabel, value: batch.issuedCount },
    { id: 'revoked', label: copy.revokedLabel, value: batch.revokedCount },
  ];

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="space-y-1 p-4 pb-0">
        <CardTitle className="text-small leading-snug">{batch.name}</CardTitle>
        <p className="text-caption text-muted-foreground">{batch.courseTitle}</p>
      </CardHeader>
      <CardContent className="p-4">
        <dl className="grid grid-cols-2 gap-2 text-caption">
          {counts.map((count) => (
            <div
              key={count.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2 py-1.5"
            >
              <dt className="text-muted-foreground">{count.label}</dt>
              <dd className="font-medium text-foreground">{String(count.value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
