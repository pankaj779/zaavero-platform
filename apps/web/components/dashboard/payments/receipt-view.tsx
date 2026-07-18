'use client';

import { Button } from '@graphology/ui';
import { useCallback, useEffect, useState } from 'react';
import { PaymentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { DASHBOARD_ROUTES } from '../../../lib/constants';
import type { InvoiceDto } from '../../../lib/payments';
import {
  StudentModuleErrorState,
  StudentModuleHeader,
  StudentModuleSkeleton,
} from '../student-academic/shared';
import { studentPaymentsCopy } from './copy';
import Link from 'next/link';

export function ReceiptView({ invoiceId }: { invoiceId: string }): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const copy = studentPaymentsCopy;
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!primaryOrganizationId) {
      throw new Error('Organization required');
    }
    return PaymentApi.getInvoice(invoiceId, primaryOrganizationId);
  }, [invoiceId, primaryOrganizationId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void load()
      .then((result) => {
        if (!cancelled) {
          setInvoice(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setInvoice(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load, reloadKey]);

  if (loading) {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title="Receipt" description="Loading invoice receipt…" />
        <StudentModuleSkeleton label="Loading receipt" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title="Receipt" description="Invoice receipt" />
        <StudentModuleErrorState
          title="Unable to load receipt"
          description="The invoice could not be loaded. Try again."
          onRetry={() => {
            setReloadKey((current) => current + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <StudentModuleHeader
          title={`Receipt ${invoice.invoiceNumber}`}
          description="Printable HTML receipt — no PDF download required."
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={DASHBOARD_ROUTES.payments}>Back to payments</Link>
          </Button>
          <Button
            type="button"
            onClick={() => {
              window.print();
            }}
          >
            {copy.printReceipt}
          </Button>
        </div>
      </div>

      <article
        className="mx-auto max-w-3xl space-y-6 rounded-xl border bg-background p-8 shadow-sm print:border-0 print:shadow-none"
        aria-label={`Receipt ${invoice.invoiceNumber}`}
      >
        <header className="space-y-1 border-b pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Payment receipt</h1>
          <p className="text-small text-muted-foreground">Invoice {invoice.invoiceNumber}</p>
          <p className="text-small capitalize text-muted-foreground">Status: {invoice.status}</p>
        </header>

        <section className="grid gap-4 tablet:grid-cols-2" aria-label="Billing parties">
          <div>
            <h2 className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
              Billed to
            </h2>
            <p className="mt-1 font-medium">{invoice.billedToName ?? '—'}</p>
            <p className="text-small text-muted-foreground">{invoice.billedToEmail ?? '—'}</p>
          </div>
          <div>
            <h2 className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
              Dates
            </h2>
            <p className="mt-1 text-small">
              Issued: {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleString() : '—'}
            </p>
            <p className="text-small">
              Paid: {invoice.paidAt ? new Date(invoice.paidAt).toLocaleString() : '—'}
            </p>
          </div>
        </section>

        <section aria-label="Line items">
          <table className="w-full border-collapse text-left text-small">
            <thead>
              <tr className="border-b">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.length > 0 ? (
                invoice.lines.map((line) => (
                  <tr key={`${line.label}-${String(line.amount.amountMinor)}`} className="border-b">
                    <td className="py-2">{line.label}</td>
                    <td className="py-2 text-right">{line.amount.formatted}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b">
                  <td className="py-2">Invoice total</td>
                  <td className="py-2 text-right">{invoice.total.formatted}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="space-y-1 text-small" aria-label="Totals">
          <div className="flex justify-between gap-4">
            <span>Subtotal</span>
            <span>{invoice.subtotal.formatted}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Discount</span>
            <span>{invoice.discount.formatted}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Tax</span>
            <span>{invoice.tax.formatted}</span>
          </div>
          <div className="flex justify-between gap-4 border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{invoice.total.formatted}</span>
          </div>
        </section>
      </article>
    </div>
  );
}
