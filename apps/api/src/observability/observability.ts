import { Logger } from '@nestjs/common';
import type { EnvConfig } from '../config/env.schema';

const logger = new Logger('Observability');

/**
 * Optional Sentry bootstrap. No-ops when SENTRY_DSN is unset so local/dev
 * environments stay dependency-light while production can enable monitoring
 * through environment variables only.
 */
export async function initSentry(config: EnvConfig): Promise<void> {
  if (!config.SENTRY_DSN) {
    logger.log('Sentry disabled (SENTRY_DSN not set).');
    return;
  }

  try {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn: config.SENTRY_DSN,
      environment: config.SENTRY_ENVIRONMENT ?? config.NODE_ENV,
      tracesSampleRate: config.SENTRY_TRACES_SAMPLE_RATE,
      release: process.env.SENTRY_RELEASE ?? process.env.RENDER_GIT_COMMIT,
    });
    logger.log('Sentry initialized.');
  } catch (error: unknown) {
    logger.warn(
      `Sentry package unavailable: ${error instanceof Error ? error.message : 'unknown'}. Install @sentry/node to enable.`,
    );
  }
}

/**
 * OpenTelemetry-ready hook. When OTEL_ENABLED=true and an OTLP endpoint is
 * configured, this attempts to load the Node SDK. Without packages installed it
 * logs readiness guidance — providers stay env-switched, no code forks.
 */
export async function initOpenTelemetry(config: EnvConfig): Promise<void> {
  if (!config.OTEL_ENABLED) {
    logger.log('OpenTelemetry disabled (OTEL_ENABLED=false).');
    return;
  }
  if (!config.OTEL_EXPORTER_OTLP_ENDPOINT) {
    logger.warn('OTEL_ENABLED=true but OTEL_EXPORTER_OTLP_ENDPOINT is missing.');
    return;
  }

  try {
    // Soft dependency: operators add @opentelemetry/sdk-node in production images.
    const moduleName = '@opentelemetry/sdk-node';
    const otel = (await import(/* webpackIgnore: true */ moduleName)) as {
      NodeSDK?: new (options: {
        serviceName?: string;
      }) => { start: () => void };
    };
    if (otel.NodeSDK) {
      const sdk = new otel.NodeSDK({ serviceName: config.OTEL_SERVICE_NAME });
      sdk.start();
      logger.log(`OpenTelemetry SDK started → ${config.OTEL_EXPORTER_OTLP_ENDPOINT}`);
      return;
    }
  } catch {
    // fall through
  }

  logger.log(
    `OpenTelemetry ready (endpoint=${config.OTEL_EXPORTER_OTLP_ENDPOINT}). Install @opentelemetry/sdk-node + exporters to activate tracing.`,
  );
}

export async function captureException(error: unknown): Promise<void> {
  try {
    const Sentry = await import('@sentry/node');
    Sentry.captureException(error);
  } catch {
    // Sentry optional
  }
}
