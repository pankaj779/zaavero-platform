import { apiFetch } from '../auth/api-client';
import {
  mapAcceptInvitationResult,
  mapEmailLog,
  mapEmailPageMeta,
  mapEmailPreferences,
  mapEmailProviderStatus,
  mapEmailQueue,
  mapEmailStats,
  mapEmailTemplate,
  mapInvitation,
  type AcceptInvitationResultDto,
  type EmailDigestMode,
  type EmailListResult,
  type EmailLogDto,
  type EmailPreferencesDto,
  type EmailProviderStatusDto,
  type EmailQueueDto,
  type EmailStatsDto,
  type EmailTemplateDto,
  type EmailTemplatePreviewDto,
  type InvitationDto,
  type InvitationType,
} from './email-mapper';

export interface UpdateEmailPreferencesInput {
  organizationId: string;
  marketing?: boolean;
  announcements?: boolean;
  assignments?: boolean;
  courses?: boolean;
  payments?: boolean;
  certificates?: boolean;
  liveClasses?: boolean;
  system?: boolean;
  digestMode?: EmailDigestMode;
}

export interface EmailListParams {
  organizationId: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PreviewEmailTemplateInput {
  organizationId: string;
  key: string;
  locale?: string;
  variables: Record<string, unknown>;
}

export interface CreateInvitationInput {
  organizationId: string;
  email: string;
  type: InvitationType;
  role: string;
}

export interface AcceptInvitationInput {
  token: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

interface ApiPage {
  items?: unknown[];
  meta?: unknown;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && String(value).trim()) search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

function listQuery(params: EmailListParams): string {
  return query({
    organizationId: params.organizationId,
    search: params.search?.trim(),
    status: params.status,
    page: params.page,
    limit: params.limit,
  });
}

function mapPage<T>(payload: ApiPage, mapper: (value: unknown) => T): EmailListResult<T> {
  return {
    items: (payload.items ?? []).map(mapper),
    meta: mapEmailPageMeta(payload.meta),
  };
}

/** Authenticated client for user preferences and the admin email workspace. */
export const EmailApi = {
  async getPreferences(organizationId: string): Promise<EmailPreferencesDto> {
    return mapEmailPreferences(
      await apiFetch<unknown>(`/email/preferences${query({ organizationId })}`),
    );
  },

  async updatePreferences(input: UpdateEmailPreferencesInput): Promise<EmailPreferencesDto> {
    return mapEmailPreferences(
      await apiFetch<unknown>('/email/preferences', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    );
  },

  async resendVerification(email: string): Promise<void> {
    await apiFetch<null>('/auth/resend-verification', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  },

  async getLogs(params: EmailListParams): Promise<EmailListResult<EmailLogDto>> {
    return mapPage(await apiFetch<ApiPage>(`/email/admin/logs${listQuery(params)}`), mapEmailLog);
  },

  async getQueue(params: EmailListParams): Promise<EmailListResult<EmailQueueDto>> {
    return mapPage(
      await apiFetch<ApiPage>(`/email/admin/queue${listQuery(params)}`),
      mapEmailQueue,
    );
  },

  async getFailed(params: EmailListParams): Promise<EmailListResult<EmailQueueDto>> {
    return mapPage(
      await apiFetch<ApiPage>(`/email/admin/failed${listQuery(params)}`),
      mapEmailQueue,
    );
  },

  async cancelQueued(id: string, organizationId: string, reason?: string): Promise<boolean> {
    const result = await apiFetch<{ updated?: boolean }>(
      `/email/admin/queue/${encodeURIComponent(id)}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...(reason ? { reason } : {}) }),
      },
    );
    return result.updated === true;
  },

  async retryQueued(id: string, organizationId: string): Promise<boolean> {
    const result = await apiFetch<{ updated?: boolean }>(
      `/email/admin/queue/${encodeURIComponent(id)}/retry`,
      { method: 'POST', body: JSON.stringify({ organizationId }) },
    );
    return result.updated === true;
  },

  async getTemplates(organizationId: string): Promise<EmailTemplateDto[]> {
    const result = await apiFetch<unknown[]>(`/email/admin/templates${query({ organizationId })}`);
    return result.map(mapEmailTemplate);
  },

  async previewTemplate(input: PreviewEmailTemplateInput): Promise<EmailTemplatePreviewDto> {
    const value = await apiFetch<Record<string, unknown>>('/email/admin/templates/preview', {
      method: 'POST',
      body: JSON.stringify({ ...input, locale: input.locale ?? 'en' }),
    });
    return {
      template: mapEmailTemplate(value.template),
      subject: typeof value.subject === 'string' ? value.subject : '',
      html: typeof value.html === 'string' ? value.html : '',
      text: typeof value.text === 'string' ? value.text : '',
      preview: typeof value.preview === 'string' ? value.preview : null,
    };
  },

  async getProvider(): Promise<EmailProviderStatusDto> {
    return mapEmailProviderStatus(await apiFetch<unknown>('/email/admin/provider'));
  },

  async getStats(organizationId: string): Promise<EmailStatsDto> {
    return mapEmailStats(await apiFetch<unknown>(`/email/admin/stats${query({ organizationId })}`));
  },

  async createInvitation(input: CreateInvitationInput): Promise<InvitationDto> {
    return mapInvitation(
      await apiFetch<unknown>('/email/invitations', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: input.organizationId,
          email: input.email.trim().toLowerCase(),
          type: input.type,
          role: input.role.trim(),
        }),
      }),
    );
  },

  async getInvitations(organizationId: string): Promise<InvitationDto[]> {
    const result = await apiFetch<unknown[]>(`/email/invitations${query({ organizationId })}`);
    return result.map(mapInvitation);
  },

  async resendInvitation(id: string, organizationId: string): Promise<InvitationDto> {
    return mapInvitation(
      await apiFetch<unknown>(`/email/invitations/${encodeURIComponent(id)}/resend`, {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      }),
    );
  },

  async revokeInvitation(id: string, organizationId: string): Promise<InvitationDto> {
    return mapInvitation(
      await apiFetch<unknown>(`/email/invitations/${encodeURIComponent(id)}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      }),
    );
  },

  async acceptInvitation(input: AcceptInvitationInput): Promise<AcceptInvitationResultDto> {
    return mapAcceptInvitationResult(
      await apiFetch<unknown>('/email/invitations/accept', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(input),
      }),
    );
  },
};
