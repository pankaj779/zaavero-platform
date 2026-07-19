import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import type { EnvConfig } from '../../../config/env.schema';
import { AI_REPOSITORY } from '../constants/injection-tokens';
import type { AIRepository } from '../interfaces/ai-repository.interface';
import { AIDocumentService } from './ai-document.service';
import { AIFeatureService } from './ai-feature.service';

@Injectable()
export class AIJobWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AIJobWorkerService.name);
  private readonly workerId = `ai-${randomUUID()}`;
  private readonly timerName = 'ai-queue-poller';
  private running = false;

  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
    private readonly documents: AIDocumentService,
    private readonly features: AIFeatureService,
    private readonly scheduler: SchedulerRegistry,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  onModuleInit(): void {
    const interval = setInterval(
      () => void this.tick(),
      this.config.get('AI_QUEUE_POLL_INTERVAL_MS', { infer: true }),
    );
    interval.unref();
    this.scheduler.addInterval(this.timerName, interval);
    void this.tick();
  }

  onModuleDestroy(): void {
    try {
      this.scheduler.deleteInterval(this.timerName);
    } catch {
      // Timer may not exist if module init failed.
    }
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.repository.recoverStuckJobs(new Date(Date.now() - 5 * 60_000));
      const batch = await this.repository.claimNextJobBatch(this.workerId, 5, new Date());
      await Promise.all(batch.map((job) => this.processJob(job)));
    } catch (error: unknown) {
      const name = error instanceof Error ? error.name : 'UnknownError';
      this.logger.error(`AI worker poll failed (${name}).`);
    } finally {
      this.running = false;
    }
  }

  private async processJob(job: {
    id: string;
    organizationId: string;
    requestedById: string | null;
    documentId: string | null;
    type: string;
    payload: unknown;
    attempts: number;
    maxAttempts: number;
    backoffSeconds: number;
  }): Promise<void> {
    try {
      if (job.type === 'EMBED_DOCUMENT' || job.type === 'REINDEX_DOCUMENT') {
        const documentId = job.documentId;
        if (!documentId) throw new Error('Document id is required for indexing jobs.');
        await this.documents.embedDocument(
          documentId,
          job.organizationId,
          job.requestedById ?? undefined,
        );
        await this.repository.markJobCompleted(job.organizationId, job.id, { indexed: true });
        return;
      }

      const payload =
        job.payload && typeof job.payload === 'object'
          ? (job.payload as Record<string, unknown>)
          : {};
      const feature = String(payload.feature ?? 'GENERAL') as never;
      const result = await this.features.generate(
        {
          id: job.requestedById ?? 'system',
          email: 'worker@system.local',
          roles: ['Teacher'],
          permissions: ['ai.generate'],
          organizationIds: [job.organizationId],
        },
        {
          organizationId: job.organizationId,
          feature,
          variables: payload,
        },
      );
      await this.repository.markJobCompleted(job.organizationId, job.id, result, result.messageId);
    } catch (error: unknown) {
      const code = error instanceof Error ? error.name : 'UNKNOWN';
      const message = error instanceof Error ? error.message : 'AI job failed.';
      if (job.attempts >= job.maxAttempts) {
        await this.repository.markJobDeadLetter(job.organizationId, job.id, code, message);
      } else {
        const backoffMs = job.backoffSeconds * 1000 * 2 ** Math.max(0, job.attempts - 1);
        await this.repository.markJobFailed(
          job.organizationId,
          job.id,
          code,
          message,
          new Date(Date.now() + backoffMs),
        );
      }
      this.logger.warn(`AI job ${job.id} failed with ${code}.`);
    }
  }
}
