'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { PaymentApi, StorageApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import type {
  AdminPaymentOverviewDto,
  CouponDto,
  InvoiceDto,
  PlanDto,
  PlanInterval,
  RefundDto,
  SubscriptionDto,
  TransactionDto,
} from '../../../lib/payments';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { AdminPageHeader } from '../shared';

type TabId =
  'overview' | 'plans' | 'transactions' | 'invoices' | 'refunds' | 'subscriptions' | 'coupons';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function AdminPaymentsView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [tab, setTab] = useState<TabId>('overview');
  const [overview, setOverview] = useState<AdminPaymentOverviewDto | null>(null);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [refunds, setRefunds] = useState<RefundDto[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<TransactionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanDto | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponDto | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, tab]);

  const load = useCallback(async () => {
    if (!primaryOrganizationId) {
      setError(true);
      setLoading(false);
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(false);
    setFormError(null);

    try {
      if (tab === 'overview') {
        const result = await PaymentApi.getAdminOverview(primaryOrganizationId);
        if (requestId !== requestIdRef.current) return;
        setOverview(result);
      } else if (tab === 'plans') {
        const result = await PaymentApi.getAdminPlans({
          organizationId: primaryOrganizationId,
          search: debouncedQuery || undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (requestId !== requestIdRef.current) return;
        setPlans(result.items);
        setMeta(result.meta);
      } else if (tab === 'transactions') {
        const result = await PaymentApi.getAdminTransactions({
          organizationId: primaryOrganizationId,
          search: debouncedQuery || undefined,
          page,
          limit: PAGE_SIZE,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        if (requestId !== requestIdRef.current) return;
        setTransactions(result.items);
        setMeta(result.meta);
        if (result.items[0]) {
          setSelectedTx((current) => current ?? result.items[0] ?? null);
        }
      } else if (tab === 'invoices') {
        const result = await PaymentApi.getAdminInvoices({
          organizationId: primaryOrganizationId,
          search: debouncedQuery || undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (requestId !== requestIdRef.current) return;
        setInvoices(result.items);
        setMeta(result.meta);
      } else if (tab === 'refunds') {
        const result = await PaymentApi.getAdminRefunds({
          organizationId: primaryOrganizationId,
          search: debouncedQuery || undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (requestId !== requestIdRef.current) return;
        setRefunds(result.items);
        setMeta(result.meta);
      } else if (tab === 'subscriptions') {
        const result = await PaymentApi.getAdminSubscriptions({
          organizationId: primaryOrganizationId,
          search: debouncedQuery || undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (requestId !== requestIdRef.current) return;
        setSubscriptions(result.items);
        setMeta(result.meta);
      } else {
        const result = await PaymentApi.getAdminCoupons({
          organizationId: primaryOrganizationId,
          search: debouncedQuery || undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (requestId !== requestIdRef.current) return;
        setCoupons(result.items);
        setMeta(result.meta);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError(true);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [debouncedQuery, page, primaryOrganizationId, tab]);

  useEffect(() => {
    void load();
  }, [load, version]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'plans', label: 'Plans' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'refunds', label: 'Refunds' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'coupons', label: 'Coupons' },
  ];

  async function handleSavePlan(form: PlanFormState): Promise<void> {
    if (!primaryOrganizationId) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editingPlan) {
        await PaymentApi.updatePlan(editingPlan.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          priceMinor: form.priceMinor,
          currency: form.currency.trim().toUpperCase() || 'INR',
          interval: form.interval,
          features: form.features
            .split(/[,\n]/)
            .map((line) => line.trim())
            .filter(Boolean),
          isActive: form.isActive,
        });
      } else {
        await PaymentApi.createPlan({
          organizationId: primaryOrganizationId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          priceMinor: form.priceMinor,
          currency: form.currency.trim().toUpperCase() || 'INR',
          interval: form.interval,
          features: form.features
            .split(/[,\n]/)
            .map((line) => line.trim())
            .filter(Boolean),
          isActive: form.isActive,
        });
      }
      setPlanOpen(false);
      setEditingPlan(null);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to save plan. Check fields and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCoupon(form: CouponFormState): Promise<void> {
    if (!primaryOrganizationId) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editingCoupon) {
        await PaymentApi.updateCoupon(editingCoupon.id, {
          description: form.description.trim() || null,
          discountType: form.discountType,
          discountValue: form.discountValue,
          currency: form.currency.trim() ? form.currency.trim().toUpperCase() : null,
          maxRedemptions: form.maxRedemptions,
          isActive: form.isActive,
        });
      } else {
        await PaymentApi.createCoupon({
          organizationId: primaryOrganizationId,
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || null,
          discountType: form.discountType,
          discountValue: form.discountValue,
          currency: form.currency.trim() ? form.currency.trim().toUpperCase() : null,
          maxRedemptions: form.maxRedemptions,
          isActive: form.isActive,
        });
      }
      setCouponOpen(false);
      setEditingCoupon(null);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to save coupon.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRefund(form: {
    orderId: string;
    amountMinor: number;
    reason: string;
  }): Promise<void> {
    if (!primaryOrganizationId) return;
    setSaving(true);
    setFormError(null);
    try {
      await PaymentApi.createRefund({
        organizationId: primaryOrganizationId,
        orderId: form.orderId.trim(),
        amountMinor: form.amountMinor,
        reason: form.reason.trim() || undefined,
      });
      setRefundOpen(false);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to create refund. Backend validates the requested amount.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign(form: {
    planId: string;
    userId: string;
    note: string;
  }): Promise<void> {
    if (!primaryOrganizationId) return;
    setSaving(true);
    setFormError(null);
    try {
      await PaymentApi.assignSubscription({
        organizationId: primaryOrganizationId,
        planId: form.planId.trim(),
        userId: form.userId.trim() || undefined,
        note: form.note.trim() || undefined,
      });
      setAssignOpen(false);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to assign subscription.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRetry(orderId: string): Promise<void> {
    if (!primaryOrganizationId) return;
    setSaving(true);
    setFormError(null);
    try {
      await PaymentApi.retryOrder(orderId, primaryOrganizationId);
      setVersion((current) => current + 1);
    } catch {
      setFormError('Unable to retry failed order.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateInvoice(invoiceId: string): Promise<void> {
    setSaving(true);
    setFormError(null);
    try {
      const updated = await PaymentApi.regenerateInvoicePdf(invoiceId);
      setInvoices((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setFormError('Unable to generate the invoice PDF.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegeneratePaymentReceipt(paymentId: string): Promise<void> {
    setSaving(true);
    setFormError(null);
    try {
      const result = await PaymentApi.regeneratePaymentReceipt(paymentId);
      setTransactions((items) =>
        items.map((item) =>
          item.paymentId === paymentId ? { ...item, receiptPdfUrl: result.url } : item,
        ),
      );
    } catch {
      setFormError('Unable to regenerate the payment receipt.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateRefundReceipt(refundId: string): Promise<void> {
    setSaving(true);
    setFormError(null);
    try {
      const updated = await PaymentApi.regenerateRefundReceipt(refundId);
      setRefunds((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setFormError('Unable to regenerate the refund receipt.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && !overview && plans.length === 0 && transactions.length === 0 && !error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Payments" description="Loading payment workspace…" />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading payments…
        </p>
      </div>
    );
  }

  if (error && !overview && plans.length === 0 && transactions.length === 0) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Payments"
          description="Revenue, plans, transactions, invoices, refunds, subscriptions, and coupons."
        />
        <TeacherModuleErrorState
          title="Unable to load payments"
          description="Retry to reload payment data from the backend."
          onRetry={() => {
            setVersion((current) => current + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Payments"
        description="Revenue, plans, transactions, invoices, refunds, subscriptions, and coupons."
        actions={
          <div className="flex flex-wrap gap-2">
            {tab === 'plans' ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditingPlan(null);
                  setPlanOpen(true);
                }}
              >
                Create plan
              </Button>
            ) : null}
            {tab === 'coupons' ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditingCoupon(null);
                  setCouponOpen(true);
                }}
              >
                Create coupon
              </Button>
            ) : null}
            {tab === 'refunds' ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setRefundOpen(true);
                }}
              >
                Issue refund
              </Button>
            ) : null}
            {tab === 'subscriptions' ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setAssignOpen(true);
                }}
              >
                Assign plan
              </Button>
            ) : null}
          </div>
        }
      />

      {formError ? (
        <p className="text-small text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Payment admin sections">
        {tabs.map((item) => (
          <Button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            size="sm"
            variant={tab === item.id ? 'default' : 'outline'}
            onClick={() => {
              setTab(item.id);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab !== 'overview' ? (
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Search…"
            aria-label="Search payments"
            className="max-w-md"
          />
          {meta.totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => {
                  setPage((current) => current - 1);
                }}
              >
                Previous
              </Button>
              <span className="text-caption text-muted-foreground">
                Page {page} of {Math.max(1, meta.totalPages)} · {meta.total} total
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= meta.totalPages || loading}
                onClick={() => {
                  setPage((current) => current + 1);
                }}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'overview' && overview ? <OverviewPanel overview={overview} /> : null}

      {tab === 'plans' ? (
        plans.length === 0 ? (
          <TeacherModuleEmptyState
            title="No plans"
            description="Create a plan to offer subscriptions."
          />
        ) : (
          <ul className="space-y-3">
            {plans.map((plan) => (
              <li key={plan.id}>
                <Card className="rounded-xl">
                  <CardContent className="flex flex-col gap-3 p-4 tablet:flex-row tablet:items-center tablet:justify-between">
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-caption text-muted-foreground">
                        {plan.price.formatted} · {plan.interval}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{plan.isActive ? 'Active' : 'Inactive'}</Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'transactions' ? (
        <TransactionsPanel
          items={transactions}
          selected={selectedTx}
          onSelect={setSelectedTx}
          onRetry={handleRetry}
          onRegenerateReceipt={handleRegeneratePaymentReceipt}
          saving={saving}
        />
      ) : null}

      {tab === 'invoices' ? (
        invoices.length === 0 ? (
          <TeacherModuleEmptyState
            title="No invoices"
            description="Issued invoices will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Card className="rounded-xl">
                  <CardContent className="flex flex-col gap-3 p-4 tablet:flex-row tablet:items-center tablet:justify-between">
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-caption capitalize text-muted-foreground">
                        {invoice.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{invoice.total.formatted}</p>
                      {invoice.pdfUrl ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                            Download PDF
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => void handleRegenerateInvoice(invoice.id)}
                      >
                        {invoice.pdfUrl ? 'Regenerate PDF' : 'Generate PDF'}
                      </Button>
                      <label className="inline-flex cursor-pointer items-center">
                        <span className="sr-only">Upload invoice PDF override</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="text-caption"
                          disabled={saving}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file || !primaryOrganizationId) {
                              return;
                            }
                            setSaving(true);
                            setFormError(null);
                            void StorageApi.upload(file, {
                              organizationId: primaryOrganizationId,
                              entityType: 'INVOICE_PDF',
                              entityId: invoice.id,
                            })
                              .then((asset) => PaymentApi.attachInvoicePdf(invoice.id, asset.id))
                              .then((updated) => {
                                setInvoices((items) =>
                                  items.map((item) => (item.id === updated.id ? updated : item)),
                                );
                              })
                              .catch(() => {
                                setFormError('Unable to attach invoice PDF override.');
                              })
                              .finally(() => {
                                setSaving(false);
                              });
                          }}
                        />
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'refunds' ? (
        refunds.length === 0 ? (
          <TeacherModuleEmptyState
            title="No refunds"
            description="Refund records will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {refunds.map((refund) => (
              <li key={refund.id}>
                <Card className="rounded-xl">
                  <CardContent className="flex flex-col gap-2 p-4 tablet:flex-row tablet:items-center tablet:justify-between">
                    <div>
                      <p className="font-medium">Order {refund.orderId}</p>
                      <p className="text-caption capitalize text-muted-foreground">
                        {refund.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{refund.amount.formatted}</p>
                      {refund.receiptPdfUrl ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={refund.receiptPdfUrl} target="_blank" rel="noopener noreferrer">
                            Download receipt
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={saving || refund.status !== 'processed'}
                        onClick={() => void handleRegenerateRefundReceipt(refund.id)}
                      >
                        {refund.receiptPdfUrl ? 'Regenerate receipt' : 'Generate receipt'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'subscriptions' ? (
        subscriptions.length === 0 ? (
          <TeacherModuleEmptyState
            title="No subscriptions"
            description="Assign a plan or wait for organization purchases."
          />
        ) : (
          <ul className="space-y-3">
            {subscriptions.map((subscription) => (
              <li key={subscription.id}>
                <Card className="rounded-xl">
                  <CardContent className="flex flex-col gap-2 p-4 tablet:flex-row tablet:items-center tablet:justify-between">
                    <div>
                      <p className="font-medium">{subscription.planName}</p>
                      <p className="text-caption capitalize text-muted-foreground">
                        {subscription.status.replaceAll('_', ' ')}
                      </p>
                    </div>
                    <p className="font-medium">{subscription.price.formatted}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === 'coupons' ? (
        coupons.length === 0 ? (
          <TeacherModuleEmptyState
            title="No coupons"
            description="Create a coupon to offer discounts."
          />
        ) : (
          <ul className="space-y-3">
            {coupons.map((coupon) => (
              <li key={coupon.id}>
                <Card className="rounded-xl">
                  <CardContent className="flex flex-col gap-2 p-4 tablet:flex-row tablet:items-center tablet:justify-between">
                    <div>
                      <p className="font-medium">{coupon.code}</p>
                      <p className="text-caption text-muted-foreground">
                        {coupon.discountType === 'percent'
                          ? `${String(coupon.discountValue)}%`
                          : `${String(coupon.discountValue)} minor units`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{coupon.isActive ? 'Active' : 'Inactive'}</Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCoupon(coupon);
                          setCouponOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : null}

      <PlanDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        plan={editingPlan}
        saving={saving}
        onSave={handleSavePlan}
      />
      <CouponDialog
        open={couponOpen}
        onOpenChange={setCouponOpen}
        coupon={editingCoupon}
        saving={saving}
        onSave={handleSaveCoupon}
      />
      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        saving={saving}
        onSave={handleRefund}
      />
      <AssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        organizationId={primaryOrganizationId}
        saving={saving}
        onSave={handleAssign}
      />
    </div>
  );
}

function OverviewPanel({ overview }: { overview: AdminPaymentOverviewDto }): React.JSX.Element {
  const cards = [
    { label: 'Revenue (total)', value: overview.revenueTotal.formatted },
    { label: 'Revenue (month)', value: overview.revenueMonth.formatted },
    { label: 'Successful', value: String(overview.successfulPayments) },
    { label: 'Failed', value: String(overview.failedPayments) },
    { label: 'Pending', value: String(overview.pendingPayments) },
    { label: 'Active subscriptions', value: String(overview.activeSubscriptions) },
    { label: 'Open refunds', value: String(overview.openRefunds) },
    { label: 'Issued invoices', value: String(overview.issuedInvoices) },
  ];

  return (
    <section className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4" aria-label="Payment KPIs">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl">
          <CardHeader className="pb-2">
            <p className="text-caption text-muted-foreground">{card.label}</p>
            <CardTitle className="text-2xl">{card.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}

function TransactionsPanel({
  items,
  selected,
  onSelect,
  onRetry,
  onRegenerateReceipt,
  saving,
}: {
  items: TransactionDto[];
  selected: TransactionDto | null;
  onSelect: (item: TransactionDto) => void;
  onRetry: (orderId: string) => Promise<void>;
  onRegenerateReceipt: (paymentId: string) => Promise<void>;
  saving: boolean;
}): React.JSX.Element {
  if (items.length === 0) {
    return (
      <TeacherModuleEmptyState
        title="No transactions"
        description="Payment transactions will appear once orders are created."
      />
    );
  }

  return (
    <div className="grid gap-4 laptop:grid-cols-[1.2fr_0.8fr]">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                selected?.id === item.id ? 'border-primary bg-muted/40' : 'hover:bg-muted/20'
              }`}
              onClick={() => {
                onSelect(item);
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{item.description}</p>
                <Badge variant="secondary" className="capitalize">
                  {item.status.replaceAll('_', ' ')}
                </Badge>
              </div>
              <p className="mt-1 text-caption text-muted-foreground">
                {item.total.formatted} · {new Date(item.createdAt).toLocaleString()}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Transaction details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-small">
            <p>
              <span className="text-muted-foreground">Order:</span> {selected.orderId}
            </p>
            <p>
              <span className="text-muted-foreground">Amount:</span> {selected.total.formatted}
            </p>
            <p>
              <span className="text-muted-foreground">User:</span>{' '}
              {selected.userName ?? selected.userEmail ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Provider order:</span>{' '}
              {selected.providerOrderId ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Provider payment:</span>{' '}
              {selected.providerPaymentId ?? '—'}
            </p>
            {selected.failureReason ? (
              <p role="status">
                <span className="text-muted-foreground">Failure:</span> {selected.failureReason}
              </p>
            ) : null}
            {selected.canRetry ? (
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => void onRetry(selected.orderId)}
              >
                Retry failed order
              </Button>
            ) : null}
            {selected.receiptPdfUrl ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={selected.receiptPdfUrl} target="_blank" rel="noopener noreferrer">
                  Download receipt
                </a>
              </Button>
            ) : null}
            {selected.paymentId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => void onRegenerateReceipt(selected.paymentId ?? '')}
              >
                {selected.receiptPdfUrl ? 'Regenerate receipt' : 'Generate receipt'}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

interface PlanFormState {
  name: string;
  description: string;
  priceMinor: number;
  currency: string;
  interval: PlanInterval;
  features: string;
  isActive: boolean;
}

function PlanDialog({
  open,
  onOpenChange,
  plan,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanDto | null;
  saving: boolean;
  onSave: (form: PlanFormState) => Promise<void>;
}): React.JSX.Element {
  const nameId = useId();
  const [form, setForm] = useState<PlanFormState>({
    name: '',
    description: '',
    priceMinor: 0,
    currency: 'INR',
    interval: 'monthly',
    features: '',
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: plan?.name ?? '',
      description: plan?.description ?? '',
      priceMinor: plan?.price.amountMinor ?? 0,
      currency: plan?.price.currency ?? 'INR',
      interval: plan?.interval ?? 'monthly',
      features: plan?.features.join(', ') ?? '',
      isActive: plan?.isActive ?? true,
    });
  }, [open, plan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit plan' : 'Create plan'}</DialogTitle>
          <DialogDescription>
            Plan prices use integer minor units. Backend validates amounts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={form.name}
              onChange={(event) => {
                setForm((current) => ({ ...current, name: event.target.value }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(event) => {
                setForm((current) => ({ ...current, description: event.target.value }));
              }}
            />
          </div>
          <div className="grid gap-3 tablet:grid-cols-2">
            <div className="space-y-2">
              <Label>Price (minor units)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={String(form.priceMinor)}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    priceMinor: Math.max(0, Math.trunc(Number(event.target.value) || 0)),
                  }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={form.currency}
                onChange={(event) => {
                  setForm((current) => ({ ...current, currency: event.target.value }));
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Interval</Label>
            <Select
              value={form.interval}
              onValueChange={(value) => {
                setForm((current) => ({ ...current, interval: value as PlanInterval }));
              }}
            >
              <SelectTrigger aria-label="Plan interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Features (comma-separated)</Label>
            <Input
              value={form.features}
              onChange={(event) => {
                setForm((current) => ({ ...current, features: event.target.value }));
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-small">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => {
                setForm((current) => ({ ...current, isActive: event.target.checked }));
              }}
            />
            Active
          </label>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !form.name.trim()}
            onClick={() => void onSave(form)}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CouponFormState {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  currency: string;
  maxRedemptions: number | null;
  isActive: boolean;
}

function CouponDialog({
  open,
  onOpenChange,
  coupon,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: CouponDto | null;
  saving: boolean;
  onSave: (form: CouponFormState) => Promise<void>;
}): React.JSX.Element {
  const [form, setForm] = useState<CouponFormState>({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: 0,
    currency: 'INR',
    maxRedemptions: null,
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      code: coupon?.code ?? '',
      description: coupon?.description ?? '',
      discountType: coupon?.discountType ?? 'percent',
      discountValue: coupon?.discountValue ?? 0,
      currency: coupon?.currency ?? 'INR',
      maxRedemptions: coupon?.maxRedemptions ?? null,
      isActive: coupon?.isActive ?? true,
    });
  }, [coupon, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{coupon ? 'Edit coupon' : 'Create coupon'}</DialogTitle>
          <DialogDescription>
            Fixed discounts use minor units. Percent discounts use whole percent points.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input
              value={form.code}
              disabled={Boolean(coupon)}
              onChange={(event) => {
                setForm((current) => ({ ...current, code: event.target.value }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(event) => {
                setForm((current) => ({ ...current, description: event.target.value }));
              }}
            />
          </div>
          <div className="grid gap-3 tablet:grid-cols-2">
            <div className="space-y-2">
              <Label>Discount type</Label>
              <Select
                value={form.discountType}
                onValueChange={(value) => {
                  setForm((current) => ({
                    ...current,
                    discountType: value as 'percent' | 'fixed',
                  }));
                }}
              >
                <SelectTrigger aria-label="Discount type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent</SelectItem>
                  <SelectItem value="fixed">Fixed (minor units)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount value</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={String(form.discountValue)}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    discountValue: Math.max(0, Math.trunc(Number(event.target.value) || 0)),
                  }));
                }}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-small">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => {
                setForm((current) => ({ ...current, isActive: event.target.checked }));
              }}
            />
            Active
          </label>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || (!coupon && !form.code.trim())}
            onClick={() => void onSave(form)}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RefundDialog({
  open,
  onOpenChange,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onSave: (form: { orderId: string; amountMinor: number; reason: string }) => Promise<void>;
}): React.JSX.Element {
  const [orderId, setOrderId] = useState('');
  const [amountMinor, setAmountMinor] = useState(0);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setOrderId('');
      setAmountMinor(0);
      setReason('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue refund</DialogTitle>
          <DialogDescription>
            Requested amount is in minor units. The backend remains authoritative for validation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Order ID</Label>
            <Input
              value={orderId}
              onChange={(event) => {
                setOrderId(event.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Amount (minor units)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={String(amountMinor)}
              onChange={(event) => {
                setAmountMinor(Math.max(0, Math.trunc(Number(event.target.value) || 0)));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !orderId.trim() || amountMinor <= 0}
            onClick={() => void onSave({ orderId, amountMinor, reason })}
          >
            Submit refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({
  open,
  onOpenChange,
  organizationId,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | null;
  saving: boolean;
  onSave: (form: { planId: string; userId: string; note: string }) => Promise<void>;
}): React.JSX.Element {
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [planId, setPlanId] = useState('');
  const [userId, setUserId] = useState('');
  const [note, setNote] = useState('');
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    if (!open || !organizationId) {
      return;
    }
    let cancelled = false;
    setLoadingPlans(true);
    void PaymentApi.getAdminPlans({ organizationId, page: 1, limit: 100, isActive: true })
      .then((result) => {
        if (cancelled) return;
        setPlans(result.items);
        setPlanId(result.items[0]?.id ?? '');
      })
      .catch(() => {
        if (!cancelled) {
          setPlans([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPlans(false);
        }
      });
    setUserId('');
    setNote('');
    return () => {
      cancelled = true;
    };
  }, [open, organizationId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign subscription plan</DialogTitle>
          <DialogDescription>
            Assign a plan to the organization or a specific user.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Plan</Label>
            {plans.length > 0 ? (
              <Select value={planId || undefined} onValueChange={setPlanId}>
                <SelectTrigger aria-label="Plan">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={planId}
                onChange={(event) => {
                  setPlanId(event.target.value);
                }}
                placeholder={loadingPlans ? 'Loading plans…' : 'Plan UUID'}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>User ID (optional)</Label>
            <Input
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || !planId.trim()}
            onClick={() => void onSave({ planId, userId, note })}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
