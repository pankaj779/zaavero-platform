import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import type { EnvConfig } from '../../../config/env.schema';
import { EmailQueueService } from './email-queue.service';

@Injectable()
export class EmailWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailWorkerService.name);
  private readonly workerId = `email-${randomUUID()}`;
  private readonly timerName = 'email-queue-poller';
  private running = false;

  constructor(
    private readonly queue: EmailQueueService,
    private readonly scheduler: SchedulerRegistry,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  onModuleInit(): void {
    const interval = setInterval(
      () => void this.tick(),
      this.config.get('EMAIL_QUEUE_POLL_INTERVAL_MS', { infer: true }),
    );
    interval.unref();
    this.scheduler.addInterval(this.timerName, interval);
    void this.tick();
  }

  onModuleDestroy(): void {
    try {
      this.scheduler.deleteInterval(this.timerName);
    } catch {
      // The timer may not have been registered if module initialization failed.
    }
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.queue.recoverStuck();
      await this.queue.processBatch(this.workerId);
    } catch (error: unknown) {
      const name = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(`Email worker poll failed (${name}).`);
    } finally {
      this.running = false;
    }
  }
}
