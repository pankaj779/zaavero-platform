export const EMAIL_CATEGORIES = [
  'SECURITY',
  'SYSTEM',
  'MARKETING',
  'ANNOUNCEMENT',
  'ASSIGNMENT',
  'COURSE',
  'PAYMENT',
  'CERTIFICATE',
  'LIVE_CLASS',
] as const;
export type EmailCategoryValue = (typeof EMAIL_CATEGORIES)[number];
export type EmailQueueStatusValue =
  'QUEUED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'DEAD_LETTER' | 'CANCELLED';
export type EmailDeliveryStatusValue =
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'OPENED'
  | 'CLICKED'
  | 'BOUNCED'
  | 'COMPLAINED'
  | 'FAILED'
  | 'CANCELLED';
export type EmailEventTypeValue =
  'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'COMPLAINED' | 'FAILED' | 'OTHER';

export interface EmailTemplateRecord {
  id: string;
  organizationId: string | null;
  key: string;
  locale: string;
  version: number;
  subject: string;
  html: string;
  text: string;
  preview: string | null;
  variableSchema: unknown;
  category: EmailCategoryValue;
  status: string;
}

export interface EmailQueueRecord {
  id: string;
  organizationId: string;
  userId: string | null;
  templateId: string | null;
  createdById: string | null;
  templateKey: string | null;
  templateVersion: number | null;
  variables: unknown;
  fromAddress: string | null;
  replyTo: string | null;
  to: string[];
  cc: string[];
  bcc: string[];
  renderedSubject: string | null;
  renderedHtml: string | null;
  renderedText: string | null;
  headers: unknown;
  tags: unknown;
  attachmentDescriptors: unknown;
  category: EmailCategoryValue;
  status: EmailQueueStatusValue;
  priority: number;
  scheduledAt: Date | null;
  availableAt: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  processedAt: Date | null;
  attempts: number;
  maxAttempts: number;
  backoffSeconds: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  deadLetteredAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  idempotencyKey: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLogRecord {
  id: string;
  organizationId: string;
  queueId: string | null;
  providerMessageId: string | null;
  to: string[];
  subject: string;
  templateKey: string | null;
  category: EmailCategoryValue;
  status: EmailDeliveryStatusValue;
  attempts: number;
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  bouncedAt: Date | null;
  complainedAt: Date | null;
  failedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailPreferenceRecord {
  id: string;
  organizationId: string;
  userId: string;
  marketing: boolean;
  announcements: boolean;
  assignments: boolean;
  courses: boolean;
  payments: boolean;
  certificates: boolean;
  liveClasses: boolean;
  system: boolean;
  digestMode: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'OFF';
  createdAt: Date;
  updatedAt: Date;
}

export interface EnqueueEmailData {
  organizationId: string;
  userId?: string;
  createdById?: string;
  templateId?: string;
  templateKey?: string;
  templateVersion?: number;
  variables?: Record<string, unknown>;
  fromAddress?: string;
  replyTo?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  renderedSubject: string;
  renderedHtml?: string;
  renderedText?: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
  attachmentDescriptors?: unknown[];
  category: EmailCategoryValue;
  priority?: number;
  scheduledAt?: Date;
  maxAttempts: number;
  idempotencyKey: string;
  correlationId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailAttachmentMetadataInput {
  filename: string;
  contentType: string;
  sizeBytes: number;
  url?: string;
  contentId?: string;
  disposition?: 'ATTACHMENT' | 'INLINE';
  checksum?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateEmailLogData {
  organizationId: string;
  userId?: string;
  queueId: string;
  initiatedById?: string;
  providerMessageId?: string;
  fromAddress: string;
  replyTo?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  templateKey?: string;
  templateVersion?: number;
  category: EmailCategoryValue;
  status: EmailDeliveryStatusValue;
  attempts: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailListFilters {
  organizationId: string;
  status?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  complained: number;
  failed: number;
}

export interface EmailRepository {
  readonly marker: 'email-repository';
  enqueue(data: EnqueueEmailData): Promise<{ created: boolean; queue: EmailQueueRecord }>;
  claimNextBatch(workerId: string, batchSize: number, now: Date): Promise<EmailQueueRecord[]>;
  recoverStuckProcessing(lockedBefore: Date): Promise<number>;
  markSent(organizationId: string, queueId: string): Promise<void>;
  markFailed(
    organizationId: string,
    queueId: string,
    errorCode: string,
    errorMessage: string,
    availableAt: Date,
  ): Promise<void>;
  markDeadLetter(
    organizationId: string,
    queueId: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void>;
  cancel(organizationId: string, queueId: string, reason?: string): Promise<boolean>;
  retryDeadLetter(organizationId: string, queueId: string): Promise<boolean>;
  createAttachmentMetadata(
    organizationId: string,
    queueId: string,
    attachments: EmailAttachmentMetadataInput[],
  ): Promise<void>;
  createLog(data: CreateEmailLogData): Promise<EmailLogRecord>;
  findLogByProviderMessageId(
    provider: string,
    providerMessageId: string,
  ): Promise<EmailLogRecord | null>;
  createEvent(data: {
    organizationId: string;
    userId?: string;
    logId?: string;
    provider: string;
    eventId: string;
    providerMessageId?: string;
    type: EmailEventTypeValue;
    occurredAt: Date;
    payload: Record<string, unknown>;
    signatureHash: string;
  }): Promise<{ created: boolean; id: string }>;
  processEvent(eventId: string, logId?: string): Promise<void>;
  updateDeliveryStatus(
    organizationId: string,
    logId: string,
    status: EmailDeliveryStatusValue,
    occurredAt: Date,
  ): Promise<void>;
  getPreference(organizationId: string, userId: string): Promise<EmailPreferenceRecord | null>;
  upsertPreference(
    organizationId: string,
    userId: string,
    data: Partial<
      Omit<EmailPreferenceRecord, 'id' | 'organizationId' | 'userId' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<EmailPreferenceRecord>;
  resolveTemplate(
    organizationId: string,
    key: string,
    locale: string,
  ): Promise<EmailTemplateRecord | null>;
  listLogs(filters: EmailListFilters): Promise<{ items: EmailLogRecord[]; total: number }>;
  listQueue(filters: EmailListFilters): Promise<{ items: EmailQueueRecord[]; total: number }>;
  listTemplates(organizationId: string, locale?: string): Promise<EmailTemplateRecord[]>;
  getStats(organizationId: string): Promise<EmailStats>;
}
