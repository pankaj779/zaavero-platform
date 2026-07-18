import { apiFetch } from '../auth/api-client';
import type {
  AdminPaymentOverviewDto,
  AssignSubscriptionInput,
  CouponDto,
  CreateCouponInput,
  CreateOrderInput,
  CreatePlanInput,
  CreateRefundInput,
  InvoiceDto,
  PaymentCatalogDto,
  PaymentConfigDto,
  PaymentHistoryItemDto,
  PaymentListResult,
  PaymentOrderDto,
  PlanDto,
  RefundDto,
  SubscriptionDto,
  TransactionDto,
  UpdateCouponInput,
  UpdatePlanInput,
  VerifyPaymentInput,
} from '../payments/payment-types';
import {
  mapAdminOverview,
  mapCatalog,
  mapCoupon,
  mapInvoice,
  mapPaymentConfig,
  mapPaymentHistoryItem,
  mapPaymentListMeta,
  mapPaymentOrder,
  mapPlan,
  mapRefund,
  mapSubscription,
  mapTransaction,
  type AdminOverviewApiRecord,
  type CouponApiRecord,
  type InvoiceApiRecord,
  type PaymentCatalogApiRecord,
  type PaymentConfigApiRecord,
  type PaymentHistoryApiRecord,
  type PaymentListMeta,
  type PaymentOrderApiRecord,
  type PlanApiRecord,
  type RefundApiRecord,
  type SubscriptionApiRecord,
  type TransactionApiRecord,
} from './payment-mapper';

export interface PaymentListParams {
  organizationId: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
}

export interface AdminPlansParams extends PaymentListParams {
  isActive?: boolean;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      continue;
    }
    query.set(key, String(value));
  }
  const serialized = query.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

function listQuery(params: PaymentListParams): string {
  return buildQuery({
    organizationId: params.organizationId,
    search: params.search?.trim(),
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    status: params.status,
  });
}

interface PaginatedPayload<T> {
  items: T[];
  meta: PaymentListMeta;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pay-${String(Date.now())}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Payment API client — all NestJS payment calls go through here.
 * Components must never call fetch directly.
 */
export const PaymentApi = {
  async getConfig(): Promise<PaymentConfigDto> {
    const record = await apiFetch<PaymentConfigApiRecord>('/payments/config');
    return mapPaymentConfig(record);
  },

  async getCatalog(organizationId: string): Promise<PaymentCatalogDto> {
    const record = await apiFetch<PaymentCatalogApiRecord>(
      `/payments/catalog${buildQuery({ organizationId })}`,
    );
    return mapCatalog(record);
  },

  async createOrder(
    input: CreateOrderInput,
    idempotencyKey = createIdempotencyKey(),
  ): Promise<PaymentOrderDto> {
    const record = await apiFetch<PaymentOrderApiRecord>('/payments/orders', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(input),
    });
    return mapPaymentOrder(record);
  },

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentOrderDto> {
    const record = await apiFetch<PaymentOrderApiRecord>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapPaymentOrder(record);
  },

  async getOrders(params: PaymentListParams): Promise<PaymentListResult<PaymentOrderDto>> {
    const payload = await apiFetch<PaginatedPayload<PaymentOrderApiRecord>>(
      `/payments/orders${listQuery(params)}`,
    );
    return {
      items: payload.items.map(mapPaymentOrder),
      meta: mapPaymentListMeta(payload.meta),
    };
  },

  async getHistory(params: PaymentListParams): Promise<PaymentListResult<PaymentHistoryItemDto>> {
    const payload = await apiFetch<PaginatedPayload<PaymentHistoryApiRecord>>(
      `/payments/history${listQuery(params)}`,
    );
    return {
      items: payload.items.map(mapPaymentHistoryItem),
      meta: mapPaymentListMeta(payload.meta),
    };
  },

  async getInvoices(params: PaymentListParams): Promise<PaymentListResult<InvoiceDto>> {
    const payload = await apiFetch<PaginatedPayload<InvoiceApiRecord>>(
      `/payments/invoices${listQuery(params)}`,
    );
    return {
      items: payload.items.map(mapInvoice),
      meta: mapPaymentListMeta(payload.meta),
    };
  },

  async getInvoice(invoiceId: string, organizationId: string): Promise<InvoiceDto> {
    const record = await apiFetch<InvoiceApiRecord>(
      `/payments/invoices/${encodeURIComponent(invoiceId)}${buildQuery({ organizationId })}`,
    );
    return mapInvoice(record);
  },

  async getCurrentSubscription(organizationId: string): Promise<SubscriptionDto | null> {
    const record = await apiFetch<SubscriptionApiRecord | null>(
      `/payments/subscriptions/current${buildQuery({ organizationId })}`,
    );
    if (!record) {
      return null;
    }
    return mapSubscription(record);
  },

  // ── Admin ──────────────────────────────────────────────────────────────

  async getAdminOverview(organizationId: string): Promise<AdminPaymentOverviewDto> {
    const record = await apiFetch<AdminOverviewApiRecord>(
      `/payments/admin/overview${buildQuery({ organizationId })}`,
    );
    return mapAdminOverview(record);
  },

  async getAdminPlans(params: AdminPlansParams): Promise<PaymentListResult<PlanDto>> {
    const payload = await apiFetch<PaginatedPayload<PlanApiRecord>>(
      `/payments/admin/plans${buildQuery({
        organizationId: params.organizationId,
        search: params.search?.trim(),
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        status: params.status,
        isActive: params.isActive,
      })}`,
    );
    return {
      items: payload.items.map(mapPlan),
      meta: mapPaymentListMeta(payload.meta),
    };
  },

  async createPlan(input: CreatePlanInput): Promise<PlanDto> {
    const record = await apiFetch<PlanApiRecord>('/payments/admin/plans', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapPlan(record);
  },

  async updatePlan(planId: string, input: UpdatePlanInput): Promise<PlanDto> {
    const record = await apiFetch<PlanApiRecord>(
      `/payments/admin/plans/${encodeURIComponent(planId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
    return mapPlan(record);
  },

  async getAdminTransactions(
    params: PaymentListParams,
  ): Promise<PaymentListResult<TransactionDto>> {
    const payload = await apiFetch<PaginatedPayload<TransactionApiRecord>>(
      `/payments/admin/transactions${listQuery(params)}`,
    );
    return {
      items: payload.items.map(mapTransaction),
      meta: mapPaymentListMeta(payload.meta),
    };
  },

  async getAdminInvoices(params: PaymentListParams): Promise<PaymentListResult<InvoiceDto>> {
    const payload = await apiFetch<PaginatedPayload<InvoiceApiRecord>>(
      `/payments/admin/invoices${listQuery(params)}`,
    );
    return {
      items: payload.items.map(mapInvoice),
      meta: mapPaymentListMeta(payload.meta),
    };
  },

  async getAdminRefunds(params: PaymentListParams): Promise<PaymentListResult<RefundDto>> {
    const payload = await apiFetch<PaginatedPayload<RefundApiRecord>>(
      `/payments/admin/refunds${listQuery(params)}`,
    );
    return {
      items: payload.items.map(mapRefund),
      meta: mapPaymentListMeta(payload.meta),
    };
  },

  async createRefund(input: CreateRefundInput): Promise<RefundDto> {
    const record = await apiFetch<RefundApiRecord>('/payments/admin/refunds', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapRefund(record);
  },

  async getAdminSubscriptions(
    params: PaymentListParams,
  ): Promise<PaymentListResult<SubscriptionDto>> {
    const payload = await apiFetch<PaginatedPayload<SubscriptionApiRecord>>(
      `/payments/admin/subscriptions${listQuery(params)}`,
    );
    return {
      items: payload.items.map(mapSubscription),
      meta: mapPaymentListMeta(payload.meta),
    };
  },

  async assignSubscription(input: AssignSubscriptionInput): Promise<SubscriptionDto> {
    const record = await apiFetch<SubscriptionApiRecord>('/payments/admin/subscriptions/assign', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapSubscription(record);
  },

  async getAdminCoupons(params: PaymentListParams): Promise<PaymentListResult<CouponDto>> {
    const payload = await apiFetch<PaginatedPayload<CouponApiRecord>>(
      `/payments/admin/coupons${listQuery(params)}`,
    );
    return {
      items: payload.items.map(mapCoupon),
      meta: mapPaymentListMeta(payload.meta),
    };
  },

  async createCoupon(input: CreateCouponInput): Promise<CouponDto> {
    const record = await apiFetch<CouponApiRecord>('/payments/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapCoupon(record);
  },

  async updateCoupon(couponId: string, input: UpdateCouponInput): Promise<CouponDto> {
    const record = await apiFetch<CouponApiRecord>(
      `/payments/admin/coupons/${encodeURIComponent(couponId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
    return mapCoupon(record);
  },

  async retryOrder(orderId: string, organizationId: string): Promise<PaymentOrderDto> {
    const record = await apiFetch<PaymentOrderApiRecord>(
      `/payments/admin/orders/${encodeURIComponent(orderId)}/retry`,
      {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      },
    );
    return mapPaymentOrder(record);
  },
};
