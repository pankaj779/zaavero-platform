import React, { useState } from 'react';
import { Alert } from 'react-native';
import { CertificatesApi, type CertificateRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { downloads } from '../../lib/downloads/downloads';
import { media } from '../../lib/media/media';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Button, Card, Row } from '../../components/ui';

export default function StudentCertificates(): React.JSX.Element {
  const organizationId = useOrganizationId();
  const [busyId, setBusyId] = useState<string | null>(null);

  const download = async (cert: CertificateRecord) => {
    setBusyId(cert.id);
    try {
      const sourcePath = cert.downloadUrl ?? `/certificates/${cert.id}/download`;
      const entry = await downloads.save({
        id: `certificate-${cert.id}`,
        kind: 'certificate',
        title: cert.title ?? cert.courseTitle ?? 'Certificate',
        sourcePath,
        fileName: `certificate-${cert.id}.pdf`,
      });
      if (entry) {
        await media.share(entry.localUri);
      } else {
        Alert.alert('Download failed', 'Could not download this certificate.');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ResourceList<CertificateRecord>
      title="Certificates"
      subtitle="Download and share your certificates"
      queryKey={['student', 'certificates-list', organizationId]}
      fetcher={() =>
        CertificatesApi.list({ organizationId, limit: 50, sortBy: 'issuedAt', sortOrder: 'desc' })
      }
      keyExtractor={(c) => c.id}
      emptyTitle="No certificates yet"
      emptyMessage="Complete a course to earn a certificate."
      renderItem={(cert) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle" numberOfLines={1}>
              {cert.title ?? cert.courseTitle ?? 'Certificate'}
            </AppText>
            <Badge label={cert.status} tone={cert.status === 'ISSUED' ? 'success' : 'default'} />
          </Row>
          {cert.issuedAt ? (
            <AppText variant="caption">Issued {new Date(cert.issuedAt).toLocaleDateString()}</AppText>
          ) : null}
          {cert.verificationCode ? (
            <AppText variant="caption">Code: {cert.verificationCode}</AppText>
          ) : null}
          <Button
            title="Download & share"
            variant="secondary"
            onPress={() => void download(cert)}
            loading={busyId === cert.id}
          />
        </Card>
      )}
    />
  );
}
