import { Logger } from '@nestjs/common';
import type { EnvConfig } from '../../../config/env.schema';
import type { EmailProvider } from './email-provider.interface';

const logger = new Logger('EmailProviderFactory');

/**
 * Selects the active email provider. The sandbox provider is only ever
 * selected outside production (env validation additionally rejects sandbox
 * settings in production).
 */
export function resolveEmailProvider(
  config: Pick<EnvConfig, 'NODE_ENV' | 'EMAIL_PROVIDER' | 'EMAIL_SANDBOX_MODE'>,
  resendProvider: EmailProvider,
  sandboxProvider: EmailProvider,
): EmailProvider {
  const isProduction = config.NODE_ENV === 'production';
  const wantsSandbox = config.EMAIL_PROVIDER === 'SANDBOX' || config.EMAIL_SANDBOX_MODE;

  if (!isProduction && wantsSandbox) {
    logger.log('Email sandbox mode active: emails are captured locally, not delivered.');
    return sandboxProvider;
  }

  if (isProduction && wantsSandbox) {
    // Defense in depth; validateEnv already rejects this combination.
    logger.warn('Sandbox email settings are ignored in production; using the Resend provider.');
  }

  return resendProvider;
}
