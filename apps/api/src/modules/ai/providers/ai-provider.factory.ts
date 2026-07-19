import { Logger } from '@nestjs/common';
import type { AIProviderValue } from '../constants/ai.constants';
import { AIProviderNotConfiguredException } from '../exceptions';
import type { AIProvider } from './ai-provider.interface';
import { AIProviderRegistry } from './ai-provider.registry';

const logger = new Logger('AIProviderFactory');

export interface AIProviderEnv {
  NODE_ENV: string;
  AI_PROVIDER: AIProviderValue;
  AI_EMBEDDING_PROVIDER?: AIProviderValue;
}

export function resolveAIChatProvider(
  env: AIProviderEnv,
  registry: AIProviderRegistry,
): AIProvider {
  const provider = registry.get(env.AI_PROVIDER);
  if (env.NODE_ENV === 'production' && env.AI_PROVIDER === 'SANDBOX') {
    throw new AIProviderNotConfiguredException('SANDBOX AI provider is forbidden in production.');
  }
  if (!provider.isConfigured()) {
    logger.warn(`AI chat provider ${env.AI_PROVIDER} is not fully configured.`);
  }
  return provider;
}

export function resolveAIEmbeddingProvider(
  env: AIProviderEnv,
  registry: AIProviderRegistry,
): AIProvider {
  const name = env.AI_EMBEDDING_PROVIDER ?? env.AI_PROVIDER;
  const provider = registry.get(name);
  if (env.NODE_ENV === 'production' && name === 'SANDBOX') {
    throw new AIProviderNotConfiguredException('SANDBOX embedding provider is forbidden in production.');
  }
  if (!provider.isConfigured()) {
    logger.warn(`AI embedding provider ${name} is not fully configured.`);
  }
  return provider;
}
