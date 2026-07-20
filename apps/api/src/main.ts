import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import type { Server } from 'node:http';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import type { EnvConfig } from './config/env.schema';
import { SWAGGER_API_DESCRIPTION, SWAGGER_TAGS } from './config/swagger.config';
import { initOpenTelemetry, initSentry } from './observability/observability';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
    bodyParser: false,
  });

  const configService = app.get(ConfigService<EnvConfig, true>);
  const port = configService.get('PORT', { infer: true });
  const host = configService.get('HOST', { infer: true });
  const corsOrigin = configService.get('CORS_ORIGIN', { infer: true });
  const nodeEnv = configService.get('NODE_ENV', { infer: true });
  const appName = configService.get('APP_NAME', { infer: true });
  const bodyLimit = configService.get('BODY_LIMIT_BYTES', { infer: true });
  const trustProxy = configService.get('TRUST_PROXY', { infer: true });
  const requestTimeoutMs = configService.get('REQUEST_TIMEOUT_MS', { infer: true });

  const observabilityConfig = {
    NODE_ENV: nodeEnv,
    SENTRY_DSN: configService.get('SENTRY_DSN', { infer: true }),
    SENTRY_ENVIRONMENT: configService.get('SENTRY_ENVIRONMENT', { infer: true }),
    SENTRY_TRACES_SAMPLE_RATE: configService.get('SENTRY_TRACES_SAMPLE_RATE', { infer: true }),
    OTEL_ENABLED: configService.get('OTEL_ENABLED', { infer: true }),
    OTEL_SERVICE_NAME: configService.get('OTEL_SERVICE_NAME', { infer: true }),
    OTEL_EXPORTER_OTLP_ENDPOINT: configService.get('OTEL_EXPORTER_OTLP_ENDPOINT', { infer: true }),
  } as EnvConfig;

  await initSentry(observabilityConfig);
  await initOpenTelemetry(observabilityConfig);

  const httpServer = app.getHttpAdapter().getInstance() as express.Express;
  if (trustProxy) {
    httpServer.set('trust proxy', 1);
  }

  app.use(express.json({ limit: bodyLimit, verify: rawBodySaver }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
      hsts: nodeEnv === 'production' ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    }),
  );
  app.use(compression());
  const configuredOrigins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // Non-browser clients (curl, server-to-server) send no Origin.
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      if (configuredOrigins.includes('*') || configuredOrigins.includes(requestOrigin)) {
        callback(null, true);
        return;
      }

      // Local E2E: allow localhost / loopback / private LAN hosts in development
      // so opening the Next.js "Network" URL still works against the API.
      if (nodeEnv !== 'production') {
        try {
          const { hostname } = new URL(requestOrigin);
          const isLocalHost =
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '::1' ||
            /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
            /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);
          if (isLocalHost) {
            callback(null, true);
            return;
          }
        } catch {
          // fall through to reject
        }
      }

      callback(new Error(`Not allowed by CORS: ${requestOrigin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'x-request-id',
      'x-razorpay-signature',
      'x-sentry-trace',
      'baggage',
    ],
    exposedHeaders: ['x-request-id', 'ETag'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Graceful shutdown for Render / Docker SIGTERM.
  app.enableShutdownHooks();

  const swaggerBuilder = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(SWAGGER_API_DESCRIPTION)
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT access token from POST /api/v1/auth/login or /api/v1/auth/refresh. Do not send refresh tokens here.',
      },
      'access-token',
    )
    .addServer(`http://localhost:${String(port)}`, 'Local development')
    .addServer('/api', 'Relative (same host)');

  for (const tag of SWAGGER_TAGS) {
    swaggerBuilder.addTag(tag.name, tag.description);
  }

  if (nodeEnv !== 'production') {
    const document = SwaggerModule.createDocument(app, swaggerBuilder.build());
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  const httpAdapter = app.getHttpAdapter().getInstance() as {
    get: (path: string, handler: (req: Request, res: Response, next: NextFunction) => void) => void;
  };

  httpAdapter.get('/', (_req: Request, res: Response) => {
    res.redirect(307, '/api/v1');
  });
  httpAdapter.get('/health', (_req: Request, res: Response) => {
    res.redirect(307, '/api/v1/health');
  });
  httpAdapter.get('/ready', (_req: Request, res: Response) => {
    res.redirect(307, '/api/v1/ready');
  });
  httpAdapter.get('/status', (_req: Request, res: Response) => {
    res.redirect(307, '/api/v1/status');
  });

  const server = (await app.listen(port, host)) as Server;
  server.setTimeout(requestTimeoutMs);
  logger.log(`API server listening on http://${host}:${String(port)}`);
  if (nodeEnv !== 'production') {
    logger.log(`Swagger docs available at http://${host}:${String(port)}/api/docs`);
  }
  logger.log(`Environment: ${nodeEnv}`);
  logger.log(`Trust proxy: ${String(trustProxy)}; body limit: ${String(bodyLimit)} bytes`);
}

function rawBodySaver(req: Request & { rawBody?: Buffer }, _res: Response, buf: Buffer): void {
  if (buf.length > 0) {
    req.rawBody = buf;
  }
}

void bootstrap();
