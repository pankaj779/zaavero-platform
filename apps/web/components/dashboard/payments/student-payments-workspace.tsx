'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PaymentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { getPaymentReceiptPath } from '../../../lib/constants';
import {
  paymentOrderStatusLabels,
  type CatalogCourseDto,
  type CatalogPlanDto,
  type InvoiceDto,
  type PaymentCatalogDto,
  type PaymentConfigDto,
  type PaymentHistoryItemDto,
  type PaymentOrderDto,
  type SubscriptionDto,
} from '../../../lib/payments';
import {
  StudentModuleEmptyState,
  StudentModuleErrorState,
  StudentModuleHeader,
  StudentModuleSkeleton,
  StudentPaginationBar,
} from '../student-academic/shared';
import { CheckoutDialog } from './checkout-dialog';
import { studentPaymentsCopy } from './copy';

type TabId = 'catalog' | 'history' | 'invoices' | 'subscription';
type ViewState = 'loading' | 'error' | 'populated';

const LIST_LIMIT = 20;

export function StudentPaymentsWorkspace(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const copy = studentPaymentsCopy;

  const [tab, setTab] = useState<TabId>('catalog');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [config, setConfig] = useState<PaymentConfigDto | null>(null);
  const [catalog, setCatalog] = useState<PaymentCatalogDto | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItemDto[]>([]);
  const [historyMeta, setHistoryMeta] = useState({
    total: 0,
    page: 1,
    limit: LIST_LIMIT,
    totalPages: 0,
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [invoiceMeta, setInvoiceMeta] = useState({
    total: 0,
    page: 1,
    limit: LIST_LIMIT,
    totalPages: 0,
  });
  const [invoicePage, setInvoicePage] = useState(1);
  const [subscription, setSubscription] = useState<SubscriptionDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<
    { kind: 'course'; course: CatalogCourseDto } | { kind: 'plan'; plan: CatalogPlanDto } | null
  >(null);
  const [flash, setFlash] = useState<string | null>(null);

  const loadCore = useCallback(
    async (signal: AbortSignal) => {
      if (!primaryOrganizationId) {
        throw new Error('Organization required');
      }
      const [nextConfig, nextCatalog, nextSubscription] = await Promise.all([
        PaymentApi.getConfig(),
        PaymentApi.getCatalog(primaryOrganizationId),
        PaymentApi.getCurrentSubscription(primaryOrganizationId),
      ]);
      if (signal.aborted) {
        return;
      }
      setConfig(nextConfig);
      setCatalog(nextCatalog);
      setSubscription(nextSubscription);
    },
    [primaryOrganizationId],
  );

  const loadHistory = useCallback(
    async (signal: AbortSignal) => {
      if (!primaryOrganizationId) {
        return;
      }
      const result = await PaymentApi.getHistory({
        organizationId: primaryOrganizationId,
        page: historyPage,
        limit: LIST_LIMIT,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      if (signal.aborted) {
        return;
      }
      setHistory(result.items);
      setHistoryMeta(result.meta);
    },
    [historyPage, primaryOrganizationId],
  );

  const loadInvoices = useCallback(
    async (signal: AbortSignal) => {
      if (!primaryOrganizationId) {
        return;
      }
      const result = await PaymentApi.getInvoices({
        organizationId: primaryOrganizationId,
        page: invoicePage,
        limit: LIST_LIMIT,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      if (signal.aborted) {
        return;
      }
      setInvoices(result.items);
      setInvoiceMeta(result.meta);
    },
    [invoicePage, primaryOrganizationId],
  );

  useEffect(() => {
    const controller = new AbortController();
    setViewState('loading');
    void (async () => {
      try {
        await loadCore(controller.signal);
        if (tab === 'history') {
          await loadHistory(controller.signal);
        } else if (tab === 'invoices') {
          await loadInvoices(controller.signal);
        }
        if (!controller.signal.aborted) {
          setViewState('populated');
        }
      } catch {
        if (!controller.signal.aborted) {
          setViewState('error');
        }
      }
    })();
    return () => {
      controller.abort();
    };
  }, [loadCore, loadHistory, loadInvoices, reloadKey, tab]);

  function openCourseCheckout(course: CatalogCourseDto): void {
    setCheckoutTarget({ kind: 'course', course });
    setCheckoutOpen(true);
  }

  function openPlanCheckout(plan: CatalogPlanDto): void {
    setCheckoutTarget({ kind: 'plan', plan });
    setCheckoutOpen(true);
  }

  function handleCheckoutCompleted(_order: PaymentOrderDto): void {
    setFlash(copy.success);
    setReloadKey((current) => current + 1);
    setTab('history');
  }

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title={copy.title} description={copy.description} />
        <StudentModuleSkeleton label={copy.loadingLabel} />
      </div>
    );
  }

  if (viewState === 'error' || !primaryOrganizationId) {
    return (
      <div className="space-y-8">
        <StudentModuleHeader title={copy.title} description={copy.description} />
        <StudentModuleErrorState
          title={copy.errorTitle}
          description={copy.errorDescription}
          onRetry={() => {
            setReloadKey((current) => current + 1);
          }}
        />
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'catalog', label: copy.tabCatalog },
    { id: 'history', label: copy.tabHistory },
    { id: 'invoices', label: copy.tabInvoices },
    { id: 'subscription', label: copy.tabSubscription },
  ];

  return (
    <div className="space-y-8">
      <StudentModuleHeader title={copy.title} description={copy.description} />

      {flash ? (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-small text-emerald-900"
          role="status"
        >
          {flash}
        </p>
      ) : null}

      {config && !config.configured ? (
        <Card className="rounded-xl border-dashed">
          <CardHeader>
            <CardTitle className="text-base">{copy.configUnsetTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-small text-muted-foreground">
              {config.message ?? copy.configUnsetDescription}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Payment sections">
        {tabs.map((item) => (
          <Button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            variant={tab === item.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTab(item.id);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab === 'catalog' ? (
        <CatalogPanel
          catalog={catalog}
          checkoutEnabled={Boolean(config?.configured)}
          onPurchaseCourse={openCourseCheckout}
          onPurchasePlan={openPlanCheckout}
        />
      ) : null}

      {tab === 'history' ? (
        <HistoryPanel
          items={history}
          page={historyMeta.page}
          totalPages={historyMeta.totalPages}
          total={historyMeta.total}
          onPageChange={setHistoryPage}
        />
      ) : null}

      {tab === 'invoices' ? (
        <InvoicesPanel
          items={invoices}
          page={invoiceMeta.page}
          totalPages={invoiceMeta.totalPages}
          total={invoiceMeta.total}
          onPageChange={setInvoicePage}
        />
      ) : null}

      {tab === 'subscription' ? (
        <SubscriptionPanel
          subscription={subscription}
          checkoutEnabled={Boolean(config?.configured)}
          plans={catalog?.plans.filter((plan) => plan.isActive) ?? []}
          onUpgrade={(plan) => {
            openPlanCheckout(plan);
          }}
        />
      ) : null}

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        organizationId={primaryOrganizationId}
        target={checkoutTarget}
        onCompleted={handleCheckoutCompleted}
      />
    </div>
  );
}

function CatalogPanel({
  catalog,
  checkoutEnabled,
  onPurchaseCourse,
  onPurchasePlan,
}: {
  catalog: PaymentCatalogDto | null;
  checkoutEnabled: boolean;
  onPurchaseCourse: (course: CatalogCourseDto) => void;
  onPurchasePlan: (plan: CatalogPlanDto) => void;
}): React.JSX.Element {
  const copy = studentPaymentsCopy;
  const courses = catalog?.courses ?? [];
  const plans = catalog?.plans.filter((plan) => plan.isActive) ?? [];

  if (courses.length === 0 && plans.length === 0) {
    return (
      <StudentModuleEmptyState
        title={copy.emptyCatalog}
        description="Check back later for new offerings."
      />
    );
  }

  return (
    <div className="space-y-8">
      {courses.length > 0 ? (
        <section className="space-y-4" aria-label="Course catalog">
          <h2 className="text-lg font-semibold">Courses</h2>
          <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-small text-muted-foreground">
                    {course.description ?? 'Course purchase'}
                  </p>
                  <p className="text-lg font-semibold">{course.price.formatted}</p>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={!checkoutEnabled}
                    onClick={() => {
                      onPurchaseCourse(course);
                    }}
                  >
                    {copy.purchaseCourse}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {plans.length > 0 ? (
        <section className="space-y-4" aria-label="Subscription plans">
          <h2 className="text-lg font-semibold">Subscription plans</h2>
          <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-small text-muted-foreground">
                    {plan.description ?? plan.interval}
                  </p>
                  <p className="text-lg font-semibold">{plan.price.formatted}</p>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={!checkoutEnabled}
                    onClick={() => {
                      onPurchasePlan(plan);
                    }}
                  >
                    Subscribe
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function HistoryPanel({
  items,
  page,
  totalPages,
  total,
  onPageChange,
}: {
  items: PaymentHistoryItemDto[];
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}): React.JSX.Element {
  const copy = studentPaymentsCopy;
  if (items.length === 0) {
    return (
      <StudentModuleEmptyState
        title={copy.emptyHistory}
        description="Completed payments will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="rounded-xl">
              <CardContent className="flex flex-col gap-3 p-4 tablet:flex-row tablet:items-center tablet:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-caption text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{paymentOrderStatusLabels[item.status]}</Badge>
                  <p className="font-medium">{item.total.formatted}</p>
                  {item.receiptPdfUrl ? (
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a href={item.receiptPdfUrl} target="_blank" rel="noopener noreferrer">
                        Download receipt
                      </a>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <StudentPaginationBar
        page={page}
        totalPages={Math.max(1, totalPages)}
        total={total}
        label="Payment history pagination"
        onPageChange={onPageChange}
      />
    </div>
  );
}

function InvoicesPanel({
  items,
  page,
  totalPages,
  total,
  onPageChange,
}: {
  items: InvoiceDto[];
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}): React.JSX.Element {
  const copy = studentPaymentsCopy;
  if (items.length === 0) {
    return (
      <StudentModuleEmptyState
        title={copy.emptyInvoices}
        description="Issued invoices will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {items.map((invoice) => (
          <li key={invoice.id}>
            <Card className="rounded-xl">
              <CardContent className="flex flex-col gap-3 p-4 tablet:flex-row tablet:items-center tablet:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-caption text-muted-foreground capitalize">{invoice.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-medium">{invoice.total.formatted}</p>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link href={getPaymentReceiptPath(invoice.id)}>{copy.viewReceipt}</Link>
                  </Button>
                  {invoice.pdfUrl ? (
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                        Download invoice
                      </a>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <StudentPaginationBar
        page={page}
        totalPages={Math.max(1, totalPages)}
        total={total}
        label="Invoice pagination"
        onPageChange={onPageChange}
      />
    </div>
  );
}

function SubscriptionPanel({
  subscription,
  checkoutEnabled,
  plans,
  onUpgrade,
}: {
  subscription: SubscriptionDto | null;
  checkoutEnabled: boolean;
  plans: CatalogPlanDto[];
  onUpgrade: (plan: CatalogPlanDto) => void;
}): React.JSX.Element {
  const copy = studentPaymentsCopy;

  if (!subscription) {
    return (
      <div className="space-y-6">
        <StudentModuleEmptyState
          title={copy.emptySubscription}
          description="Choose a plan from the catalog to get started."
        />
        {plans.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {plans.map((plan) => (
              <Button
                key={plan.id}
                type="button"
                disabled={!checkoutEnabled}
                onClick={() => {
                  onUpgrade(plan);
                }}
              >
                {plan.name} · {plan.price.formatted}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const upgradeCandidates = plans.filter((plan) => plan.id !== subscription.planId);

  return (
    <Card className="rounded-xl">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{subscription.planName}</CardTitle>
          <Badge variant="secondary" className="capitalize">
            {subscription.status.replaceAll('_', ' ')}
          </Badge>
        </div>
        <p className="text-small text-muted-foreground">
          {subscription.price.formatted} · {subscription.interval}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.currentPeriodEnd ? (
          <p className="text-small text-muted-foreground">
            Current period ends {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        ) : null}
        {subscription.renewMessage ? (
          <p className="text-small" role="status">
            {subscription.renewMessage}
          </p>
        ) : null}
        {subscription.upgradeMessage ? (
          <p className="text-small" role="status">
            {subscription.upgradeMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {subscription.canRenew ? (
            <Button
              type="button"
              disabled={!checkoutEnabled}
              onClick={() => {
                const plan = plans.find((item) => item.id === subscription.planId);
                if (plan) {
                  onUpgrade(plan);
                }
              }}
            >
              {copy.renew}
            </Button>
          ) : null}
          {subscription.canUpgrade && upgradeCandidates.length > 0
            ? upgradeCandidates.slice(0, 3).map((plan) => (
                <Button
                  key={plan.id}
                  type="button"
                  variant="outline"
                  disabled={!checkoutEnabled}
                  onClick={() => {
                    onUpgrade(plan);
                  }}
                >
                  {copy.upgrade}: {plan.name}
                </Button>
              ))
            : null}
        </div>
      </CardContent>
    </Card>
  );
}
