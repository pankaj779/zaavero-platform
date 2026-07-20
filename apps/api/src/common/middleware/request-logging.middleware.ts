import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Structured HTTP access log (key=value JSON) so log aggregators / Sentry
 * breadcrumbs can parse requestId, method, path, status, and duration.
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request & { requestId?: string }, res: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const { method, originalUrl } = req;
    const requestId = req.requestId ?? 'n/a';

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const payload = {
        level: 'info',
        type: 'http_access',
        requestId,
        method,
        path: originalUrl,
        status: res.statusCode,
        durationMs,
        timestamp: new Date().toISOString(),
      };
      this.logger.log(JSON.stringify(payload));
    });

    next();
  }
}
