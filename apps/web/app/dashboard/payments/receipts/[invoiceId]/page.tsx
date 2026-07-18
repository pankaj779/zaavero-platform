import { ReceiptView } from '../../../../../components/dashboard/payments';

export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}): Promise<React.JSX.Element> {
  const { invoiceId } = await params;
  return <ReceiptView invoiceId={invoiceId} />;
}
