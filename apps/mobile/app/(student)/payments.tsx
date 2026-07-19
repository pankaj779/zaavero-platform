import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { PaymentsApi, type InvoiceRecord } from '../../lib/api/endpoints';
import { checkout } from '../../lib/payments/checkout';
import { downloads } from '../../lib/downloads/downloads';
import { useOrganizationId } from '../../lib/hooks/use-org';
import { ResourceList } from '../../components/resource-list';
import { AppText, Badge, Button, Card, Row } from '../../components/ui';
import { useTheme } from '../../lib/theme/theme';

export default function StudentPayments(): React.JSX.Element {
  const theme = useTheme();
  const organizationId = useOrganizationId();
  const [checkingOut, setCheckingOut] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const config = useQuery({
    queryKey: ['payments', 'config'],
    queryFn: () => PaymentsApi.config(),
  });

  const startCheckout = async () => {
    setCheckingOut(true);
    try {
      const result = await checkout.createOrder({ organizationId });
      Alert.alert(
        'Order created',
        `Order ${result.order.id} (${result.order.currency} ${result.order.amount}) via ${result.config.provider}. Complete payment on the web portal or via the Razorpay sheet.`,
      );
    } catch (err) {
      Alert.alert('Checkout failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const downloadInvoice = async (invoice: InvoiceRecord) => {
    setBusyId(invoice.id);
    try {
      const sourcePath = invoice.downloadUrl ?? `/payments/invoices/${invoice.id}/download`;
      const entry = await downloads.save({
        id: `invoice-${invoice.id}`,
        kind: 'invoice',
        title: invoice.number ?? `Invoice ${invoice.id}`,
        sourcePath,
        fileName: `invoice-${invoice.id}.pdf`,
      });
      Alert.alert(entry ? 'Saved' : 'Failed', entry ? 'Invoice available in Downloads.' : 'Try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ResourceList<InvoiceRecord>
      title="Payments"
      subtitle={
        config.data
          ? `Provider: ${config.data.provider}${config.data.currency ? ` · ${config.data.currency}` : ''}`
          : 'Invoices, receipts and checkout'
      }
      queryKey={['student', 'invoices', organizationId]}
      fetcher={() => PaymentsApi.invoices({ organizationId, limit: 50 })}
      keyExtractor={(i) => i.id}
      emptyTitle="No invoices yet"
      header={
        <View style={{ marginBottom: theme.spacing(4), gap: theme.spacing(3) }}>
          <AppText variant="title">Payments</AppText>
          <AppText variant="caption">
            Checkout reuses the Razorpay backend. Orders, invoices and receipts are produced by the
            same NestJS endpoints as the web app.
          </AppText>
          <Button title="Start checkout" onPress={() => void startCheckout()} loading={checkingOut} />
        </View>
      }
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
          <Button
            title="Download invoice"
            variant="secondary"
            onPress={() => void downloadInvoice(invoice)}
            loading={busyId === invoice.id}
          />
        </Card>
      )}
    />
  );
}
