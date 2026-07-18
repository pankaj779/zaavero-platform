export type {
  EmailAttachmentInput,
  EmailDeliveryStatus,
  EmailProvider,
  EmailProviderName,
  EmailProviderStatus,
  EmailTag,
  EmailWebhookEvent,
  EmailWebhookRequest,
  SendBatchEmailRequest,
  SendBatchOptions,
  SendEmailRequest,
  SendEmailResult,
} from './email-provider.interface';
export { resolveEmailProvider } from './email-provider.factory';
export { ResendEmailProvider } from './resend-email.provider';
export { SandboxEmailProvider } from './sandbox-email.provider';
