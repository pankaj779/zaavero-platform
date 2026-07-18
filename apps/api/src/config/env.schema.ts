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
  })
  .transform((config) => ({
    ...config,
    EMAIL_FROM: config.EMAIL_FROM ?? DEFAULT_LOCAL_EMAIL_FROM,
    // Sandbox is the safe default everywhere except production.
    EMAIL_SANDBOX_MODE: config.EMAIL_SANDBOX_MODE ?? config.NODE_ENV !== 'production',
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
