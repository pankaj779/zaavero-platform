import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../database/database.constants';
import type { EnvConfig } from '../config/env.schema';

export interface ProviderHealthSnapshot {
  name: string;
  configured: boolean;
  notes?: string;
}

export interface DeepHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: { status: 'up' | 'down'; latencyMs?: number; error?: string };
    providers: ProviderHealthSnapshot[];
  };
}

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async checkDatabase(): Promise<{ status: 'up' | 'down'; latencyMs?: number; error?: string }> {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'database check failed';
      this.logger.error(`Database readiness failed: ${message}`);
      return { status: 'down', latencyMs: Date.now() - started, error: message };
    }
  }

  providerSnapshots(): ProviderHealthSnapshot[] {
    const emailProvider = this.config.get('EMAIL_PROVIDER', { infer: true });
    const storageProvider = this.config.get('STORAGE_PROVIDER', { infer: true });
    const aiProvider = this.config.get('AI_PROVIDER', { infer: true });
    const meetingSandbox = this.config.get('MEETING_SANDBOX_MODE', { infer: true });
    const resendKey = this.config.get('RESEND_API_KEY', { infer: true });
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    const razorpayKey = this.config.get('RAZORPAY_KEY_ID', { infer: true });

    return [
      {
        name: 'email',
        configured: emailProvider === 'RESEND' && resendKey != null && resendKey.length > 0,
        notes: `provider=${emailProvider}`,
      },
      {
        name: 'storage',
        configured:
          storageProvider === 'CLOUDINARY' && cloudName != null && cloudName.length > 0,
        notes: `provider=${storageProvider}`,
      },
      {
        name: 'payments',
        configured: razorpayKey != null && razorpayKey.length > 0,
        notes: 'razorpay',
      },
      {
        name: 'ai',
        configured: aiProvider !== 'SANDBOX',
        notes: `provider=${aiProvider}`,
      },
      {
        name: 'meetings',
        configured: !meetingSandbox,
        notes: meetingSandbox ? 'sandbox' : 'zoom/google-meet',
      },
    ];
  }

  async getDeepHealth(): Promise<DeepHealthResponse> {
    const database = await this.checkDatabase();
    const providers = this.providerSnapshots();
    const status: DeepHealthResponse['status'] =
      database.status === 'down' ? 'unhealthy' : 'healthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      checks: { database, providers },
    };
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.logger.log('Prisma client disconnected.');
    } catch (error: unknown) {
      this.logger.warn(
        `Prisma disconnect warning: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}
