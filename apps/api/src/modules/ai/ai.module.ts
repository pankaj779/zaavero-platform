import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import type { EnvConfig } from '../../config/env.schema';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import {
  AI_CHAT_PROVIDER,
  AI_EMBEDDING_PROVIDER,
  AI_PROVIDER_REGISTRY,
  AI_REPOSITORY,
} from './constants/injection-tokens';
import { AdminAIController } from './controllers/admin-ai.controller';
import { StudentAIController } from './controllers/student-ai.controller';
import { TeacherAIController } from './controllers/teacher-ai.controller';
import { AnthropicProvider, GeminiProvider } from './providers/anthropic-gemini.providers';
import { resolveAIChatProvider, resolveAIEmbeddingProvider } from './providers/ai-provider.factory';
import { AIProviderRegistry } from './providers/ai-provider.registry';
import {
  AzureOpenAIProvider,
  GroqProvider,
  OllamaProvider,
  OpenAIProvider,
  OpenRouterProvider,
  SandboxAIProvider,
} from './providers/openai-family.providers';
import { PrismaAIRepository } from './repositories/prisma-ai.repository';
import { AIConversationService } from './services/ai-conversation.service';
import { AIDocumentService } from './services/ai-document.service';
import { AIFeatureService } from './services/ai-feature.service';
import { AIInsightsService } from './services/ai-insights.service';
import { AIJobWorkerService } from './services/ai-job-worker.service';
import { AIPromptService } from './services/ai-prompt.service';
import { AIQuotaService } from './services/ai-quota.service';
import { AIRetrievalService } from './services/ai-retrieval.service';
import { AISafetyService } from './services/ai-safety.service';
import { AIService } from './services/ai.service';
import { AIUsageService } from './services/ai-usage.service';

@Global()
@Module({
  imports: [ScheduleModule, forwardRef(() => AuthModule), StorageModule],
  controllers: [StudentAIController, TeacherAIController, AdminAIController],
  providers: [
    OpenAIProvider,
    AzureOpenAIProvider,
    AnthropicProvider,
    GeminiProvider,
    OllamaProvider,
    OpenRouterProvider,
    GroqProvider,
    SandboxAIProvider,
    AIProviderRegistry,
    AIService,
    AIConversationService,
    AIFeatureService,
    AIDocumentService,
    AIRetrievalService,
    AIPromptService,
    AIQuotaService,
    AISafetyService,
    AIUsageService,
    AIInsightsService,
    AIJobWorkerService,
    {
      provide: AI_REPOSITORY,
      useClass: PrismaAIRepository,
    },
    {
      provide: AI_PROVIDER_REGISTRY,
      useExisting: AIProviderRegistry,
    },
    {
      provide: AI_CHAT_PROVIDER,
      useFactory: (config: ConfigService<EnvConfig, true>, registry: AIProviderRegistry) =>
        resolveAIChatProvider(
          {
            NODE_ENV: config.get('NODE_ENV', { infer: true }),
            AI_PROVIDER: config.get('AI_PROVIDER', { infer: true }),
          },
          registry,
        ),
      inject: [ConfigService, AIProviderRegistry],
    },
    {
      provide: AI_EMBEDDING_PROVIDER,
      useFactory: (config: ConfigService<EnvConfig, true>, registry: AIProviderRegistry) =>
        resolveAIEmbeddingProvider(
          {
            NODE_ENV: config.get('NODE_ENV', { infer: true }),
            AI_PROVIDER: config.get('AI_PROVIDER', { infer: true }),
            AI_EMBEDDING_PROVIDER: config.get('AI_EMBEDDING_PROVIDER', { infer: true }),
          },
          registry,
        ),
      inject: [ConfigService, AIProviderRegistry],
    },
  ],
  exports: [AIService, AI_REPOSITORY, AI_CHAT_PROVIDER, AI_EMBEDDING_PROVIDER],
})
export class AIModule {}
