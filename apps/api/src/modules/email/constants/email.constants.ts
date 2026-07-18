/** Resend batch API accepts at most 100 emails per request. */
export const EMAIL_BATCH_MAX_SIZE = 100;

/** Maximum accepted age (and future skew) of a webhook timestamp, in seconds. */
export const DEFAULT_EMAIL_WEBHOOK_TOLERANCE_SECONDS = 300;

/** Prefix for message ids issued by the sandbox provider. */
export const SANDBOX_MESSAGE_ID_PREFIX = 'sandbox_';
