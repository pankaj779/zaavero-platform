import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);

/** Accepts real booleans (tests/config objects) and common env string forms. */
const booleanFromEnv = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1');

export const DEFAULT_LOCAL_EMAIL_FROM = 'no-reply@graphology.local';

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  APP_NAME: z.string().default('Graphology Platform'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3001'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: nonEmptyString,
  DIRECT_URL: nonEmptyString,
  JWT_SECRET: nonEmptyString,
  JWT_REFRESH_SECRET: nonEmptyString.optional(),
  REFRESH_TOKEN_SECRET: nonEmptyString,
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_ACCESS_EXPIRATION: z.string().optional(),
  JWT_REFRESH_EXPIRATION: z.string().optional(),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  RESEND_API_KEY: nonEmptyString.optional(),
  RESEND_WEBHOOK_SECRET: nonEmptyString.optional(),
  EMAIL_FROM: z.string().email().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),
  EMAIL_PROVIDER: z.enum(['RESEND', 'SANDBOX']).default('RESEND'),
  EMAIL_SANDBOX_MODE: booleanFromEnv.optional(),
  EMAIL_QUEUE_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15_000),
  EMAIL_QUEUE_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(20),
  EMAIL_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
  EMAIL_WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().positive().default(300),
  RAZORPAY_KEY_ID: nonEmptyString.optional(),
  RAZORPAY_SECRET: nonEmptyString.optional(),
  RAZORPAY_WEBHOOK_SECRET: nonEmptyString.optional(),
  RAZORPAY_API_URL: z.string().url().default('https://api.razorpay.com/v1'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER_ROOT: z.string().trim().min(1).default('graphology'),
  STORAGE_PROVIDER: z.enum(['CLOUDINARY', 'SANDBOX']).default('CLOUDINARY'),
  STORAGE_SANDBOX_MODE: booleanFromEnv.optional(),
  STORAGE_SIGNED_UPLOAD_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(600),
  STORAGE_MAX_FILE_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(100 * 1024 * 1024),
  STORAGE_SERVER_UPLOAD_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 1024 * 1024),
  /** Comma-separated MIME allow list; falls back to the built-in defaults. */
  STORAGE_ALLOWED_MIME_TYPES: z.string().trim().min(1).optional(),
  /** AES-256 key material for meeting OAuth tokens / host secrets (hex-64, base64-32, or passphrase). */
  TOKEN_ENCRYPTION_KEY: z.string().trim().min(16).optional(),
  ZOOM_CLIENT_ID: z.string().trim().min(1).optional(),
  ZOOM_CLIENT_SECRET: z.string().trim().min(1).optional(),
  ZOOM_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
  GOOGLE_MEET_CLIENT_ID: z.string().trim().min(1).optional(),
  GOOGLE_MEET_CLIENT_SECRET: z.string().trim().min(1).optional(),
  MEETING_SANDBOX_MODE: booleanFromEnv.optional(),
  AI_PROVIDER: z
    .enum([
      'OPENAI',
      'AZURE_OPENAI',
      'ANTHROPIC',
      'GOOGLE_GEMINI',
      'OLLAMA',
      'OPENROUTER',
      'GROQ',
      'SANDBOX',
    ])
    .default('OPENAI'),
  AI_EMBEDDING_PROVIDER: z
    .enum([
      'OPENAI',
      'AZURE_OPENAI',
      'ANTHROPIC',
      'GOOGLE_GEMINI',
      'OLLAMA',
      'OPENROUTER',
      'GROQ',
      'SANDBOX',
    ])
    .optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().optional(),
  AZURE_OPENAI_API_VERSION: z.string().default('2024-10-21'),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),
  AZURE_OPENAI_EMBEDDING_DEPLOYMENT: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-haiku-latest'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  OPENROUTER_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://127.0.0.1:11434'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  AI_DAILY_TOKEN_LIMIT_USER: z.coerce.number().int().positive().default(200_000),
  AI_MONTHLY_TOKEN_LIMIT_USER: z.coerce.number().int().positive().default(2_000_000),
  AI_DAILY_TOKEN_LIMIT_ORG: z.coerce.number().int().positive().default(2_000_000),
  AI_MONTHLY_TOKEN_LIMIT_ORG: z.coerce.number().int().positive().default(20_000_000),
  AI_CHUNK_SIZE: z.coerce.number().int().positive().default(800),
  AI_CHUNK_OVERLAP: z.coerce.number().int().min(0).default(120),
  AI_RETRIEVAL_TOP_K: z.coerce.number().int().positive().default(6),
  AI_QUEUE_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15_000),
  /** When true (or "1"), Express trusts X-Forwarded-* from Render/Vercel proxies. */
  TRUST_PROXY: booleanFromEnv.optional(),
  /** Max JSON / urlencoded body size in bytes (multipart uploads use STORAGE_* caps). */
  BODY_LIMIT_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(1 * 1024 * 1024),
  /** Soft request timeout hint for reverse proxies (ms). */
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
  THROTTLE_AUTH_LIMIT: z.coerce.number().int().positive().default(20),
  AUDIT_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
  SENTRY_DSN: z.string().trim().min(1).optional(),
  SENTRY_ENVIRONMENT: z.string().trim().min(1).optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  OTEL_ENABLED: booleanFromEnv.optional(),
  OTEL_SERVICE_NAME: z.string().default('graphology-api'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
});

export const envSchema = baseEnvSchema
  .superRefine((config, ctx) => {
    if (config.NODE_ENV !== 'production') {
      return;
    }

    if (config.EMAIL_SANDBOX_MODE === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['EMAIL_SANDBOX_MODE'],
        message: 'EMAIL_SANDBOX_MODE must not be enabled in production.',
      });
    }
    if (config.EMAIL_PROVIDER === 'SANDBOX') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['EMAIL_PROVIDER'],
        message: 'EMAIL_PROVIDER must not be SANDBOX in production.',
      });
    }
    if (!config.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY is required in production.',
      });
    }
    if (!config.RESEND_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RESEND_WEBHOOK_SECRET'],
        message: 'RESEND_WEBHOOK_SECRET is required in production.',
      });
    }
    if (!config.EMAIL_FROM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['EMAIL_FROM'],
        message: 'EMAIL_FROM (or RESEND_FROM_EMAIL) is required in production.',
      });
    }

    if (config.STORAGE_SANDBOX_MODE === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['STORAGE_SANDBOX_MODE'],
        message: 'STORAGE_SANDBOX_MODE must not be enabled in production.',
      });
    }
    if (config.STORAGE_PROVIDER === 'SANDBOX') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['STORAGE_PROVIDER'],
        message: 'STORAGE_PROVIDER must not be SANDBOX in production.',
      });
    }
    if (config.STORAGE_PROVIDER === 'CLOUDINARY') {
      for (const key of [
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
      ] as const) {
        if (!config[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required in production when STORAGE_PROVIDER is CLOUDINARY.`,
          });
        }
      }
    }
    if (config.MEETING_SANDBOX_MODE === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MEETING_SANDBOX_MODE'],
        message: 'MEETING_SANDBOX_MODE must not be enabled in production.',
      });
    }
    if (!config.TOKEN_ENCRYPTION_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['TOKEN_ENCRYPTION_KEY'],
        message: 'TOKEN_ENCRYPTION_KEY is required in production for meeting OAuth token storage.',
      });
    }
    if (config.AI_PROVIDER === 'SANDBOX') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AI_PROVIDER'],
        message: 'AI_PROVIDER must not be SANDBOX in production.',
      });
    }
    if (config.AI_EMBEDDING_PROVIDER === 'SANDBOX') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AI_EMBEDDING_PROVIDER'],
        message: 'AI_EMBEDDING_PROVIDER must not be SANDBOX in production.',
      });
    }
  })
  .transform((config) => ({
    ...config,
    EMAIL_FROM: config.EMAIL_FROM ?? DEFAULT_LOCAL_EMAIL_FROM,
    // Sandbox is the safe default everywhere except production.
    EMAIL_SANDBOX_MODE: config.EMAIL_SANDBOX_MODE ?? config.NODE_ENV !== 'production',
    STORAGE_SANDBOX_MODE: config.STORAGE_SANDBOX_MODE ?? config.NODE_ENV !== 'production',
    MEETING_SANDBOX_MODE: config.MEETING_SANDBOX_MODE ?? config.NODE_ENV !== 'production',
    AI_EMBEDDING_PROVIDER: config.AI_EMBEDDING_PROVIDER ?? config.AI_PROVIDER,
    TRUST_PROXY: config.TRUST_PROXY ?? true,
    OTEL_ENABLED: config.OTEL_ENABLED ?? false,
  }));

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const normalized: Record<string, unknown> = {
    ...config,
    RAZORPAY_SECRET: config.RAZORPAY_SECRET ?? config.RAZORPAY_KEY_SECRET,
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN ?? config.JWT_ACCESS_EXPIRATION,
    FRONTEND_URL: config.FRONTEND_URL ?? config.APP_URL ?? 'http://localhost:3000',
    EMAIL_FROM: config.EMAIL_FROM ?? config.RESEND_FROM_EMAIL,
    REFRESH_TOKEN_SECRET: config.REFRESH_TOKEN_SECRET ?? config.JWT_REFRESH_SECRET,
    REFRESH_TOKEN_EXPIRES_IN:
      config.REFRESH_TOKEN_EXPIRES_IN ?? config.JWT_REFRESH_EXPIRATION ?? '7d',
  };

  const parsed = envSchema.safeParse(normalized);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return parsed.data;
}
