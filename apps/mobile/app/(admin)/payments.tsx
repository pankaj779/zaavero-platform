import React from 'react';
import { PaymentsApi, type InvoiceRecord } from '../../lib/api/endpoints';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Card, Row } from '../../components/ui';

export default function AdminPayments(): React.JSX.Element {
  const organizationId = useOrganizationId();
  return (
    <ResourceList<InvoiceRecord>
      title="Payments"
      subtitle="Invoices and receipts (Razorpay-backed)"
      queryKey={['admin', 'payments', organizationId]}
      fetcher={() => PaymentsApi.invoices({ organizationId, limit: 50 })}
      keyExtractor={(i) => i.id}
      emptyTitle="No invoices"
      renderItem={(invoice) => (
        <Card>
          <Row justify="space-between">
            <AppText variant="subtitle">{invoice.number ?? invoice.id.slice(0, 8)}</AppText>
            <Badge label={invoice.status} tone={invoice.status === 'PAID' ? 'success' : 'default'} />
          </Row>
          <AppText variant="caption">
            {invoice.currency} {invoice.amount}
            {invoice.issuedAt ? ` · ${new Date(invoice.issuedAt).toLocaleDateString()}` : ''}
          </AppText>
        </Card>
      )}
    />
  );
}
