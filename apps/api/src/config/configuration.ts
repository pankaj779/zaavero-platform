import type { EnvConfig } from './env.schema';
import { DEFAULT_LOCAL_EMAIL_FROM } from './env.schema';

function booleanFromEnv(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value === 'true' || value === '1';
}

export default (): EnvConfig => {
  const nodeEnv = process.env.NODE_ENV;
  const resolvedNodeEnv: EnvConfig['NODE_ENV'] =
    nodeEnv === 'production' || nodeEnv === 'test' || nodeEnv === 'development'
      ? nodeEnv
      : 'development';

  const emailProvider: EnvConfig['EMAIL_PROVIDER'] =
    process.env.EMAIL_PROVIDER === 'SANDBOX' ? 'SANDBOX' : 'RESEND';

  const storageProvider: EnvConfig['STORAGE_PROVIDER'] =
    process.env.STORAGE_PROVIDER === 'SANDBOX' ? 'SANDBOX' : 'CLOUDINARY';

  return {
    NODE_ENV: resolvedNodeEnv,
    PORT: Number(process.env.PORT ?? 3001),
    HOST: process.env.HOST ?? '0.0.0.0',
    APP_NAME: process.env.APP_NAME ?? 'Graphology Platform',
    APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
    API_URL: process.env.API_URL ?? 'http://localhost:3001',
    FRONTEND_URL: process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:3000',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    DIRECT_URL: process.env.DIRECT_URL ?? '',
    JWT_SECRET: process.env.JWT_SECRET ?? '',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ?? process.env.JWT_REFRESH_SECRET ?? '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? process.env.JWT_ACCESS_EXPIRATION ?? '15m',
    JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION,
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION,
    REFRESH_TOKEN_EXPIRES_IN:
      process.env.REFRESH_TOKEN_EXPIRES_IN ?? process.env.JWT_REFRESH_EXPIRATION ?? '7d',
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    EMAIL_FROM: process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL ?? DEFAULT_LOCAL_EMAIL_FROM,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    EMAIL_PROVIDER: emailProvider,
    EMAIL_SANDBOX_MODE:
      booleanFromEnv(process.env.EMAIL_SANDBOX_MODE) ?? resolvedNodeEnv !== 'production',
    EMAIL_QUEUE_POLL_INTERVAL_MS: Number(process.env.EMAIL_QUEUE_POLL_INTERVAL_MS ?? 15_000),
    EMAIL_QUEUE_BATCH_SIZE: Number(process.env.EMAIL_QUEUE_BATCH_SIZE ?? 20),
    EMAIL_MAX_ATTEMPTS: Number(process.env.EMAIL_MAX_ATTEMPTS ?? 5),
    EMAIL_WEBHOOK_TOLERANCE_SECONDS: Number(process.env.EMAIL_WEBHOOK_TOLERANCE_SECONDS ?? 300),
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_SECRET: process.env.RAZORPAY_SECRET ?? process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    RAZORPAY_API_URL: process.env.RAZORPAY_API_URL ?? 'https://api.razorpay.com/v1',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER_ROOT: process.env.CLOUDINARY_FOLDER_ROOT ?? 'graphology',
    STORAGE_PROVIDER: storageProvider,
    STORAGE_SANDBOX_MODE:
      booleanFromEnv(process.env.STORAGE_SANDBOX_MODE) ?? resolvedNodeEnv !== 'production',
    STORAGE_SIGNED_UPLOAD_TTL_SECONDS: Number(process.env.STORAGE_SIGNED_UPLOAD_TTL_SECONDS ?? 600),
    STORAGE_MAX_FILE_SIZE_BYTES: Number(
      process.env.STORAGE_MAX_FILE_SIZE_BYTES ?? 100 * 1024 * 1024,
    ),
    STORAGE_SERVER_UPLOAD_MAX_BYTES: Number(
      process.env.STORAGE_SERVER_UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024,
    ),
    STORAGE_ALLOWED_MIME_TYPES: process.env.STORAGE_ALLOWED_MIME_TYPES,
  };
};
