import React from 'react';
import { CertificatesApi, type CertificateRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function TeacherCertificates(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<CertificateRecord>
      title="Certificates"
      subtitle="Issued certificates for your learners"
      queryKey={['teacher', 'certificates', organizationId]}
      fetcher={() =>
        CertificatesApi.list({ organizationId, limit: 50, sortBy: 'issuedAt', sortOrder: 'desc' })
      }
      keyExtractor={(c) => c.id}
      emptyTitle="No certificates"
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
        </Card>
      )}
    />
  );
}
