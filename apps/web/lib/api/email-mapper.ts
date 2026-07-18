export type EmailDigestMode = 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'OFF';

export interface EmailPreferencesDto {
  security: true;
  marketing: boolean;
  announcements: boolean;
  assignments: boolean;
  courses: boolean;
  payments: boolean;
  certificates: boolean;
  liveClasses: boolean;
  system: boolean;
  digestMode: EmailDigestMode;
}

export interface EmailPageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmailLogDto {
  id: string;
  to: string[];
  subject: string;
  templateKey: string | null;
  category: string;
  status: string;
  attempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface EmailQueueDto {
  id: string;
  to: string[];
  renderedSubject: string | null;
  templateKey: string | null;
  category: string;
  status: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  lastErrorMessage: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

export interface EmailTemplateDto {
  id: string;
  organizationId: string | null;
  key: string;
  locale: string;
  version: number;
  subject: string;
  preview: string | null;
  category: string;
  status: string;
  variableSchema: unknown;
}

export interface EmailTemplatePreviewDto {
  template: EmailTemplateDto;
  subject: string;
  html: string;
  text: string;
  preview: string | null;
}

export interface EmailProviderStatusDto {
  provider: 'RESEND' | 'SANDBOX';
  configured: boolean;
  sandbox: boolean;
  webhookVerificationConfigured: boolean;
}

export interface EmailStatsDto {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  complained: number;
  failed: number;
}

export interface EmailListResult<T> {
  items: T[];
  meta: EmailPageMeta;
}

export type InvitationType = 'TEACHER' | 'STUDENT' | 'ORGANIZATION';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface InvitationDto {
  id: string;
  organizationId: string;
  invitedById: string | null;
  acceptedById: string | null;
  email: string;
  role: string;
  type: InvitationType;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AcceptInvitationResultDto {
  invitationId: string;
  userId: string;
}

type ApiRecord = Record<string, unknown>;

const asRecord = (value: unknown): ApiRecord =>
  typeof value === 'object' && value !== null ? (value as ApiRecord) : {};
const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;
const asNullableString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;
const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;
const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export function mapEmailPreferences(value: unknown): EmailPreferencesDto {
  const record = asRecord(value);
  const digest = asString(record.digestMode);
  return {
    security: true,
    marketing: asBoolean(record.marketing),
    announcements: asBoolean(record.announcements, true),
    assignments: asBoolean(record.assignments, true),
    courses: asBoolean(record.courses, true),
    payments: asBoolean(record.payments, true),
    certificates: asBoolean(record.certificates, true),
    liveClasses: asBoolean(record.liveClasses, true),
    system: asBoolean(record.system, true),
    digestMode:
      digest === 'DAILY' || digest === 'WEEKLY' || digest === 'OFF' ? digest : 'IMMEDIATE',
  };
}

export function mapEmailPageMeta(value: unknown): EmailPageMeta {
  const record = asRecord(value);
  return {
    total: asNumber(record.total),
    page: Math.max(1, asNumber(record.page, 1)),
    limit: Math.max(1, asNumber(record.limit, 20)),
    totalPages: Math.max(0, asNumber(record.totalPages)),
  };
}

export function mapEmailLog(value: unknown): EmailLogDto {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    to: asStringArray(record.to),
    subject: asString(record.subject),
    templateKey: asNullableString(record.templateKey),
    category: asString(record.category),
    status: asString(record.status),
    attempts: asNumber(record.attempts),
    errorCode: asNullableString(record.errorCode),
    errorMessage: asNullableString(record.errorMessage),
    createdAt: asString(record.createdAt),
  };
}

export function mapEmailQueue(value: unknown): EmailQueueDto {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    to: asStringArray(record.to),
    renderedSubject: asNullableString(record.renderedSubject),
    templateKey: asNullableString(record.templateKey),
    category: asString(record.category),
    status: asString(record.status),
    priority: asNumber(record.priority),
    attempts: asNumber(record.attempts),
    maxAttempts: asNumber(record.maxAttempts),
    lastErrorMessage: asNullableString(record.lastErrorMessage),
    scheduledAt: asNullableString(record.scheduledAt),
    createdAt: asString(record.createdAt),
  };
}

export function mapEmailTemplate(value: unknown): EmailTemplateDto {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    organizationId: asNullableString(record.organizationId),
    key: asString(record.key),
    locale: asString(record.locale, 'en'),
    version: asNumber(record.version),
    subject: asString(record.subject),
    preview: asNullableString(record.preview),
    category: asString(record.category),
    status: asString(record.status),
    variableSchema: record.variableSchema,
  };
}

export function mapEmailProviderStatus(value: unknown): EmailProviderStatusDto {
  const record = asRecord(value);
  return {
    provider: record.provider === 'RESEND' ? 'RESEND' : 'SANDBOX',
    configured: asBoolean(record.configured),
    sandbox: asBoolean(record.sandbox, true),
    webhookVerificationConfigured: asBoolean(record.webhookVerificationConfigured),
  };
}

export function mapEmailStats(value: unknown): EmailStatsDto {
  const record = asRecord(value);
  return {
    total: asNumber(record.total),
    sent: asNumber(record.sent),
    delivered: asNumber(record.delivered),
    opened: asNumber(record.opened),
    bounced: asNumber(record.bounced),
    complained: asNumber(record.complained),
    failed: asNumber(record.failed),
  };
}

function mapInvitationType(value: unknown): InvitationType {
  return value === 'TEACHER' || value === 'ORGANIZATION' ? value : 'STUDENT';
}

function mapInvitationStatus(value: unknown): InvitationStatus {
  if (value === 'ACCEPTED' || value === 'REVOKED' || value === 'EXPIRED') {
    return value;
  }
  return 'PENDING';
}

export function mapInvitation(value: unknown): InvitationDto {
  const record = asRecord(value);
  return {
    id: asString(record.id),
    organizationId: asString(record.organizationId),
    invitedById: asNullableString(record.invitedById),
    acceptedById: asNullableString(record.acceptedById),
    email: asString(record.email),
    role: asString(record.role),
    type: mapInvitationType(record.type),
    status: mapInvitationStatus(record.status),
    expiresAt: asString(record.expiresAt),
    acceptedAt: asNullableString(record.acceptedAt),
    revokedAt: asNullableString(record.revokedAt),
    createdAt: asString(record.createdAt),
    updatedAt: asString(record.updatedAt),
  };
}

export function mapAcceptInvitationResult(value: unknown): AcceptInvitationResultDto {
  const record = asRecord(value);
  return {
    invitationId: asString(record.invitationId),
    userId: asString(record.userId),
  };
}
