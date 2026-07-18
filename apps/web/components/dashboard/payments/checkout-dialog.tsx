'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@graphology/ui';
import { useId, useState } from 'react';
import { PaymentApi } from '../../../lib/api';
import { useAuthContext } from '../../../lib/auth';
import {
  openRazorpayCheckout,
  type CatalogCourseDto,
  type CatalogPlanDto,
  type PaymentOrderDto,
  type PaymentPurpose,
} from '../../../lib/payments';
import { studentPaymentsCopy } from './copy';

type CheckoutTarget =
  { kind: 'course'; course: CatalogCourseDto } | { kind: 'plan'; plan: CatalogPlanDto };

export function CheckoutDialog({
  open,
  onOpenChange,
  organizationId,
  target,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  target: CheckoutTarget | null;
  onCompleted: (order: PaymentOrderDto) => void;
}): React.JSX.Element {
  const copy = studentPaymentsCopy;
  const { user } = useAuthContext();
  const batchFieldId = useId();
  const couponFieldId = useId();

  const [batchId, setBatchId] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [order, setOrder] = useState<PaymentOrderDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const course = target?.kind === 'course' ? target.course : null;
  const plan = target?.kind === 'plan' ? target.plan : null;

  function resetState(): void {
    setBatchId('');
    setCouponCode('');
    setOrder(null);
    setBusy(false);
    setStatusMessage(null);
    setError(null);
  }

  function handleOpenChange(next: boolean): void {
    if (!next) {
      resetState();
    }
    onOpenChange(next);
  }

  async function createOrder(): Promise<void> {
    if (!target) {
      return;
    }
    if (course && course.batches.length > 0 && !batchId) {
      setError('Select a batch to continue.');
      return;
    }

    setBusy(true);
    setError(null);
    setStatusMessage(null);

    const purpose: PaymentPurpose =
      target.kind === 'plan' ? 'ORGANIZATION_SUBSCRIPTION' : 'COURSE_PURCHASE';

    try {
      const created = await PaymentApi.createOrder({
        organizationId,
        purpose,
        courseId: course?.id,
        batchId: batchId || undefined,
        planId: plan?.id,
        couponCode: couponCode.trim() || undefined,
      });
      setOrder(created);
      setStatusMessage(null);
    } catch {
      setError('Unable to create order. Check your selection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function startCheckout(): Promise<void> {
    if (!order) {
      return;
    }
    if (!order.checkoutPublicKey || !order.providerOrderId) {
      setError('Checkout is unavailable for this order. Payment provider may be unset.');
      return;
    }

    setBusy(true);
    setError(null);
    setStatusMessage(null);

    try {
      await openRazorpayCheckout({
        key: order.checkoutPublicKey,
        amount: order.total.amountMinor,
        currency: order.total.currency,
        name: course?.title ?? plan?.name ?? 'Payment',
        description: order.receiptNumber ?? order.id,
        order_id: order.providerOrderId,
        prefill: {
          name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || undefined,
          email: user?.email ?? undefined,
        },
        handler: (response) => {
          void (async () => {
            setStatusMessage(copy.verifying);
            try {
              const verified = await PaymentApi.verifyPayment({
                organizationId,
                orderId: order.id,
                providerOrderId: response.razorpay_order_id,
                providerPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              setStatusMessage(copy.success);
              onCompleted(verified);
              handleOpenChange(false);
            } catch {
              setError(copy.failed);
              setStatusMessage(null);
            } finally {
              setBusy(false);
            }
          })();
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setStatusMessage(copy.cancelled);
          },
        },
      });
    } catch {
      setBusy(false);
      setError(copy.failed);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.checkoutTitle}</DialogTitle>
          <DialogDescription>
            {course?.title ?? plan?.name ?? 'Complete your purchase'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {course && course.batches.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor={batchFieldId}>{copy.selectBatch}</Label>
              <Select
                value={batchId || undefined}
                onValueChange={setBatchId}
                disabled={Boolean(order) || busy}
              >
                <SelectTrigger id={batchFieldId} aria-label={copy.selectBatch}>
                  <SelectValue placeholder={copy.selectBatch} />
                </SelectTrigger>
                <SelectContent>
                  {course.batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={couponFieldId}>{copy.couponLabel}</Label>
            <Input
              id={couponFieldId}
              value={couponCode}
              onChange={(event) => {
                setCouponCode(event.target.value);
              }}
              placeholder={copy.couponPlaceholder}
              disabled={Boolean(order) || busy}
              autoComplete="off"
            />
          </div>

          {order ? (
            <div className="space-y-2 rounded-lg border p-4" aria-live="polite">
              <p className="text-small font-medium">{copy.orderSummary}</p>
              <ul className="space-y-1 text-small text-muted-foreground">
                {order.lines.map((line) => (
                  <li
                    key={`${line.label}-${String(line.amount.amountMinor)}`}
                    className="flex justify-between gap-4"
                  >
                    <span>{line.label}</span>
                    <span>{line.amount.formatted}</span>
                  </li>
                ))}
                <li className="flex justify-between gap-4">
                  <span>Subtotal</span>
                  <span>{order.subtotal.formatted}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Discount</span>
                  <span>{order.discount.formatted}</span>
                </li>
                <li className="flex justify-between gap-4">
                  <span>Tax</span>
                  <span>{order.tax.formatted}</span>
                </li>
                <li className="flex justify-between gap-4 font-medium text-foreground">
                  <span>Total</span>
                  <span>{order.total.formatted}</span>
                </li>
              </ul>
            </div>
          ) : null}

          {error ? (
            <p className="text-small text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {statusMessage ? (
            <p className="text-small text-muted-foreground" role="status">
              {statusMessage}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleOpenChange(false);
            }}
            disabled={busy}
          >
            Close
          </Button>
          {!order ? (
            <Button type="button" onClick={() => void createOrder()} disabled={busy || !target}>
              {copy.continueCheckout}
            </Button>
          ) : (
            <Button type="button" onClick={() => void startCheckout()} disabled={busy}>
              Pay {order.total.formatted}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
