import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { EnvConfig } from '../../../config/env.schema';
import type { AIFeatureValue, AIProviderValue } from '../constants/ai.constants';
import { AI_REPOSITORY } from '../constants/injection-tokens';
import { AIQuotaExceededException } from '../exceptions';
import type { AIRepository } from '../interfaces/ai-repository.interface';

@Injectable()
export class AIQuotaService {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  getLimits() {
    return {
      dailyUser: this.config.get('AI_DAILY_TOKEN_LIMIT_USER', { infer: true }),
      monthlyUser: this.config.get('AI_MONTHLY_TOKEN_LIMIT_USER', { infer: true }),
      dailyOrg: this.config.get('AI_DAILY_TOKEN_LIMIT_ORG', { infer: true }),
      monthlyOrg: this.config.get('AI_MONTHLY_TOKEN_LIMIT_ORG', { infer: true }),
    };
  }

  async getQuotaSnapshot(input: { organizationId: string; userId: string }) {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const limits = this.getLimits();
    const [userDaily, userMonthly, orgDaily, orgMonthly] = await Promise.all([
      this.repository.sumUsageTokens({
        organizationId: input.organizationId,
        userId: input.userId,
        since: dayStart,
      }),
      this.repository.sumUsageTokens({
        organizationId: input.organizationId,
        userId: input.userId,
        since: monthStart,
      }),
      this.repository.sumUsageTokens({ organizationId: input.organizationId, since: dayStart }),
      this.repository.sumUsageTokens({ organizationId: input.organizationId, since: monthStart }),
    ]);
    return {
      limits,
      usage: {
        userDaily: userDaily.totalTokens,
        userMonthly: userMonthly.totalTokens,
        orgDaily: orgDaily.totalTokens,
        orgMonthly: orgMonthly.totalTokens,
      },
    };
  }

  /**
   * Concurrency-safe quota reservation:
   * advisory lock → check daily/monthly user+org totals → reserve estimated tokens.
   */
  async reserve(input: {
    organizationId: string;
    userId: string;
    estimatedTokens: number;
    provider: AIProviderValue;
    model: string;
    feature: AIFeatureValue;
    conversationId?: string;
    correlationId?: string;
  }): Promise<{ reservationId: string }> {
    const lockKey = `ai-quota:${input.organizationId}:${input.userId}`;
    const locked = await this.repository.tryAdvisoryLock(lockKey);
    if (!locked) {
      // Another request holds the lock; wait briefly then retry once.
      await new Promise((resolve) => setTimeout(resolve, 50 + Math.floor(Math.random() * 50)));
      const retried = await this.repository.tryAdvisoryLock(lockKey);
      if (!retried) {
        throw new AIQuotaExceededException('AI quota is busy; please retry shortly.');
      }
    }

    try {
      await this.assertWithinLimits({
        organizationId: input.organizationId,
        userId: input.userId,
        estimatedTokens: input.estimatedTokens,
      });
      const created = await this.repository.createUsage({
        organizationId: input.organizationId,
        userId: input.userId,
        conversationId: input.conversationId,
        provider: input.provider,
        model: input.model,
        modelType: 'CHAT',
        usageType: 'RESERVATION',
        feature: input.feature,
        status: 'RESERVED',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: input.estimatedTokens,
        reservedTokens: input.estimatedTokens,
        requestId: randomUUID(),
        correlationId: input.correlationId,
        success: true,
      });
      return { reservationId: created.id };
    } finally {
      await this.repository.releaseAdvisoryLock(lockKey);
    }
  }

  async commitReservation(input: {
    organizationId: string;
    reservationId: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs?: number;
    messageId?: string;
    conversationId?: string;
    costMicros?: bigint;
  }): Promise<void> {
    await this.repository.updateUsage(input.organizationId, input.reservationId, {
      status: 'COMMITTED',
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      totalTokens: input.totalTokens,
      reservedTokens: 0,
      latencyMs: input.latencyMs,
      messageId: input.messageId,
      conversationId: input.conversationId,
      costMicros: input.costMicros,
      success: true,
    });
  }

  async releaseReservation(input: {
    organizationId: string;
    reservationId: string;
    errorCode?: string;
  }): Promise<void> {
    await this.repository.updateUsage(input.organizationId, input.reservationId, {
      status: 'RELEASED',
      totalTokens: 0,
      reservedTokens: 0,
      success: false,
      errorCode: input.errorCode ?? 'CANCELLED',
    });
  }

  async assertWithinLimits(input: {
    organizationId: string;
    userId: string;
    estimatedTokens: number;
  }): Promise<void> {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [userDaily, userMonthly, orgDaily, orgMonthly] = await Promise.all([
      this.repository.sumUsageTokens({
        organizationId: input.organizationId,
        userId: input.userId,
        since: dayStart,
      }),
      this.repository.sumUsageTokens({
        organizationId: input.organizationId,
        userId: input.userId,
        since: monthStart,
      }),
      this.repository.sumUsageTokens({ organizationId: input.organizationId, since: dayStart }),
      this.repository.sumUsageTokens({ organizationId: input.organizationId, since: monthStart }),
    ]);

    const dailyUserLimit = this.config.get('AI_DAILY_TOKEN_LIMIT_USER', { infer: true });
    const monthlyUserLimit = this.config.get('AI_MONTHLY_TOKEN_LIMIT_USER', { infer: true });
    const dailyOrgLimit = this.config.get('AI_DAILY_TOKEN_LIMIT_ORG', { infer: true });
    const monthlyOrgLimit = this.config.get('AI_MONTHLY_TOKEN_LIMIT_ORG', { infer: true });

    if (userDaily.totalTokens + input.estimatedTokens > dailyUserLimit) {
      throw new AIQuotaExceededException('Daily user AI token quota exceeded.');
    }
    if (userMonthly.totalTokens + input.estimatedTokens > monthlyUserLimit) {
      throw new AIQuotaExceededException('Monthly user AI token quota exceeded.');
    }
    if (orgDaily.totalTokens + input.estimatedTokens > dailyOrgLimit) {
      throw new AIQuotaExceededException('Daily organization AI token quota exceeded.');
    }
    if (orgMonthly.totalTokens + input.estimatedTokens > monthlyOrgLimit) {
      throw new AIQuotaExceededException('Monthly organization AI token quota exceeded.');
    }
  }
}
