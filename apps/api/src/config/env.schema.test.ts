import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.schema';

const validEnv = {
  NODE_ENV: 'development',
  PORT: '3001',
  DATABASE_URL: 'postgresql://graphology:graphology@localhost:5432/graphology?schema=public',
  DIRECT_URL: 'postgresql://graphology:graphology@localhost:5432/graphology?schema=public',
  JWT_SECRET: 'change-me-in-production',
  REFRESH_TOKEN_SECRET: 'change-me-refresh-secret',
  RESEND_API_KEY: 're_placeholder',
  EMAIL_FROM: 'noreply@example.com',
  RAZORPAY_KEY_ID: 'rzp_placeholder',
  RAZORPAY_SECRET: 'rzp_secret_placeholder',
};

describe('validateEnv', () => {
  it('accepts a valid environment configuration', () => {
    const config = validateEnv(validEnv);
    expect(config.PORT).toBe(3001);
    expect(config.DATABASE_URL).toContain('postgresql://');
  });

  it('accepts RAZORPAY_KEY_SECRET as an alias for RAZORPAY_SECRET', () => {
    const config = validateEnv({
      ...validEnv,
      RAZORPAY_SECRET: undefined,
      RAZORPAY_KEY_SECRET: 'rzp_secret_alias',
    });

    expect(config.RAZORPAY_SECRET).toBe('rzp_secret_alias');
  });

  it('allows Razorpay credentials to remain unset locally', () => {
    const config = validateEnv({
      ...validEnv,
      RAZORPAY_KEY_ID: undefined,
      RAZORPAY_SECRET: undefined,
    });

    expect(config.RAZORPAY_KEY_ID).toBeUndefined();
    expect(config.RAZORPAY_SECRET).toBeUndefined();
    expect(config.RAZORPAY_API_URL).toBe('https://api.razorpay.com/v1');
  });

  it('accepts JWT_ACCESS_EXPIRATION as an alias for JWT_EXPIRES_IN', () => {
    const config = validateEnv({
      ...validEnv,
      JWT_EXPIRES_IN: undefined,
      JWT_ACCESS_EXPIRATION: '30m',
    });

    expect(config.JWT_EXPIRES_IN).toBe('30m');
  });

  it('accepts RESEND_FROM_EMAIL as an alias for EMAIL_FROM', () => {
    const config = validateEnv({
      ...validEnv,
      EMAIL_FROM: undefined,
      RESEND_FROM_EMAIL: 'alias@example.com',
    });

    expect(config.EMAIL_FROM).toBe('alias@example.com');
  });

  it('defaults FRONTEND_URL from APP_URL when omitted', () => {
    const config = validateEnv({
      ...validEnv,
      APP_URL: 'http://localhost:3000',
      FRONTEND_URL: undefined,
    });

    expect(config.FRONTEND_URL).toBe('http://localhost:3000');
  });

  it('accepts JWT_REFRESH_SECRET as an alias for REFRESH_TOKEN_SECRET', () => {
    const config = validateEnv({
      ...validEnv,
      REFRESH_TOKEN_SECRET: undefined,
      JWT_REFRESH_SECRET: 'legacy-refresh-secret',
    });

    expect(config.REFRESH_TOKEN_SECRET).toBe('legacy-refresh-secret');
  });

  it('accepts JWT_REFRESH_EXPIRATION as an alias for REFRESH_TOKEN_EXPIRES_IN', () => {
    const config = validateEnv({
      ...validEnv,
      REFRESH_TOKEN_EXPIRES_IN: undefined,
      JWT_REFRESH_EXPIRATION: '14d',
    });

    expect(config.REFRESH_TOKEN_EXPIRES_IN).toBe('14d');
  });

  it('fails fast when required variables are missing', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'development',
        PORT: '3001',
      }),
    ).toThrow(/Invalid environment configuration/);
  });

  describe('email configuration', () => {
    const productionEnv = {
      ...validEnv,
      NODE_ENV: 'production',
      RESEND_API_KEY: 're_live_key',
      RESEND_WEBHOOK_SECRET: 'whsec_live',
      EMAIL_FROM: 'no-reply@graphology.app',
      CLOUDINARY_CLOUD_NAME: 'demo-cloud',
      CLOUDINARY_API_KEY: 'key_123',
      CLOUDINARY_API_SECRET: 'secret_456',
      TOKEN_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      MEETING_SANDBOX_MODE: 'false',
      AI_PROVIDER: 'OPENAI',
      OPENAI_API_KEY: 'sk-test-production',
    };

    it('allows Resend credentials to remain unset outside production', () => {
      const config = validateEnv({
        ...validEnv,
        RESEND_API_KEY: undefined,
        EMAIL_FROM: undefined,
        RESEND_WEBHOOK_SECRET: undefined,
      });

      expect(config.RESEND_API_KEY).toBeUndefined();
      expect(config.RESEND_WEBHOOK_SECRET).toBeUndefined();
      expect(config.EMAIL_FROM).toBe('no-reply@graphology.local');
    });

    it('applies email defaults (provider, sandbox, queue tuning)', () => {
      const config = validateEnv(validEnv);

      expect(config.EMAIL_PROVIDER).toBe('RESEND');
      expect(config.EMAIL_SANDBOX_MODE).toBe(true);
      expect(config.EMAIL_QUEUE_POLL_INTERVAL_MS).toBe(15_000);
      expect(config.EMAIL_QUEUE_BATCH_SIZE).toBe(20);
      expect(config.EMAIL_MAX_ATTEMPTS).toBe(5);
      expect(config.EMAIL_WEBHOOK_TOLERANCE_SECONDS).toBe(300);
      expect(config.EMAIL_REPLY_TO).toBeUndefined();
    });

    it('parses EMAIL_SANDBOX_MODE from env strings', () => {
      expect(validateEnv({ ...validEnv, EMAIL_SANDBOX_MODE: 'false' }).EMAIL_SANDBOX_MODE).toBe(
        false,
      );
      expect(validateEnv({ ...validEnv, EMAIL_SANDBOX_MODE: 'true' }).EMAIL_SANDBOX_MODE).toBe(
        true,
      );
    });

    it('accepts a fully configured production email environment', () => {
      const config = validateEnv(productionEnv);

      expect(config.EMAIL_SANDBOX_MODE).toBe(false);
      expect(config.EMAIL_FROM).toBe('no-reply@graphology.app');
    });

    it('requires Resend credentials and webhook secret in production', () => {
      expect(() => validateEnv({ ...productionEnv, RESEND_API_KEY: undefined })).toThrow(
        /RESEND_API_KEY is required in production/,
      );
      expect(() => validateEnv({ ...productionEnv, RESEND_WEBHOOK_SECRET: undefined })).toThrow(
        /RESEND_WEBHOOK_SECRET is required in production/,
      );
      expect(() =>
        validateEnv({ ...productionEnv, EMAIL_FROM: undefined, RESEND_FROM_EMAIL: undefined }),
      ).toThrow(/EMAIL_FROM \(or RESEND_FROM_EMAIL\) is required in production/);
    });

    it('forbids sandbox email settings in production', () => {
      expect(() => validateEnv({ ...productionEnv, EMAIL_SANDBOX_MODE: 'true' })).toThrow(
        /EMAIL_SANDBOX_MODE must not be enabled in production/,
      );
      expect(() => validateEnv({ ...productionEnv, EMAIL_PROVIDER: 'SANDBOX' })).toThrow(
        /EMAIL_PROVIDER must not be SANDBOX in production/,
      );
    });

    it('rejects invalid email tuning values', () => {
      expect(() => validateEnv({ ...validEnv, EMAIL_QUEUE_BATCH_SIZE: '101' })).toThrow(
        /EMAIL_QUEUE_BATCH_SIZE/,
      );
      expect(() => validateEnv({ ...validEnv, EMAIL_MAX_ATTEMPTS: '0' })).toThrow(
        /EMAIL_MAX_ATTEMPTS/,
      );
      expect(() => validateEnv({ ...validEnv, EMAIL_REPLY_TO: 'not-an-email' })).toThrow(
        /EMAIL_REPLY_TO/,
      );
    });
  });

  describe('storage configuration', () => {
    const productionEnv = {
      ...validEnv,
      NODE_ENV: 'production',
      RESEND_API_KEY: 're_live_key',
      RESEND_WEBHOOK_SECRET: 'whsec_live',
      EMAIL_FROM: 'no-reply@graphology.app',
      CLOUDINARY_CLOUD_NAME: 'demo-cloud',
      CLOUDINARY_API_KEY: 'key_123',
      CLOUDINARY_API_SECRET: 'secret_456',
      STORAGE_SANDBOX_MODE: 'false',
      TOKEN_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      MEETING_SANDBOX_MODE: 'false',
      AI_PROVIDER: 'OPENAI',
      OPENAI_API_KEY: 'sk-test-production',
    };

    it('applies storage defaults outside production', () => {
      const config = validateEnv(validEnv);

      expect(config.STORAGE_PROVIDER).toBe('CLOUDINARY');
      expect(config.STORAGE_SANDBOX_MODE).toBe(true);
      expect(config.CLOUDINARY_FOLDER_ROOT).toBe('graphology');
      expect(config.STORAGE_SIGNED_UPLOAD_TTL_SECONDS).toBe(600);
      expect(config.STORAGE_MAX_FILE_SIZE_BYTES).toBe(100 * 1024 * 1024);
      expect(config.STORAGE_SERVER_UPLOAD_MAX_BYTES).toBe(10 * 1024 * 1024);
      expect(config.STORAGE_ALLOWED_MIME_TYPES).toBeUndefined();
    });

    it('accepts a fully configured production storage environment', () => {
      const config = validateEnv(productionEnv);
      expect(config.STORAGE_PROVIDER).toBe('CLOUDINARY');
      expect(config.STORAGE_SANDBOX_MODE).toBe(false);
    });

    it('requires Cloudinary credentials in production', () => {
      expect(() => validateEnv({ ...productionEnv, CLOUDINARY_API_SECRET: undefined })).toThrow(
        /CLOUDINARY_API_SECRET is required in production/,
      );
      expect(() => validateEnv({ ...productionEnv, CLOUDINARY_CLOUD_NAME: undefined })).toThrow(
        /CLOUDINARY_CLOUD_NAME is required in production/,
      );
    });

    it('forbids sandbox storage settings in production', () => {
      expect(() => validateEnv({ ...productionEnv, STORAGE_SANDBOX_MODE: 'true' })).toThrow(
        /STORAGE_SANDBOX_MODE must not be enabled in production/,
      );
      expect(() => validateEnv({ ...productionEnv, STORAGE_PROVIDER: 'SANDBOX' })).toThrow(
        /STORAGE_PROVIDER must not be SANDBOX in production/,
      );
    });

    it('rejects invalid storage tuning values', () => {
      expect(() => validateEnv({ ...validEnv, STORAGE_SIGNED_UPLOAD_TTL_SECONDS: '10' })).toThrow(
        /STORAGE_SIGNED_UPLOAD_TTL_SECONDS/,
      );
      expect(() => validateEnv({ ...validEnv, STORAGE_MAX_FILE_SIZE_BYTES: '0' })).toThrow(
        /STORAGE_MAX_FILE_SIZE_BYTES/,
      );
    });
  });

  describe('ai configuration', () => {
    const productionEnv = {
      ...validEnv,
      NODE_ENV: 'production',
      RESEND_API_KEY: 're_live_key',
      RESEND_WEBHOOK_SECRET: 'whsec_live',
      EMAIL_FROM: 'no-reply@graphology.app',
      CLOUDINARY_CLOUD_NAME: 'demo-cloud',
      CLOUDINARY_API_KEY: 'key_123',
      CLOUDINARY_API_SECRET: 'secret_456',
      STORAGE_SANDBOX_MODE: 'false',
      TOKEN_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      MEETING_SANDBOX_MODE: 'false',
      AI_PROVIDER: 'OPENAI',
      OPENAI_API_KEY: 'sk-test-production',
    };

    it('applies AI defaults outside production', () => {
      const config = validateEnv(validEnv);
      expect(config.AI_PROVIDER).toBe('OPENAI');
      expect(config.EMBEDDING_DIMENSIONS).toBe(1536);
      expect(config.AI_RETRIEVAL_TOP_K).toBe(6);
    });

    it('forbids sandbox AI providers in production', () => {
      expect(() => validateEnv({ ...productionEnv, AI_PROVIDER: 'SANDBOX' })).toThrow(
        /AI_PROVIDER must not be SANDBOX in production/,
      );
      expect(() => validateEnv({ ...productionEnv, AI_EMBEDDING_PROVIDER: 'SANDBOX' })).toThrow(
        /AI_EMBEDDING_PROVIDER must not be SANDBOX in production/,
      );
    });
  });
});
