import { Injectable } from '@nestjs/common';
import type { AIProviderValue } from '../constants/ai.constants';
import { InvalidAIRequestException } from '../exceptions';
import type { AIProvider } from './ai-provider.interface';
import { AnthropicProvider, GeminiProvider } from './anthropic-gemini.providers';
import {
  AzureOpenAIProvider,
  GroqProvider,
  OllamaProvider,
  OpenAIProvider,
  OpenRouterProvider,
  SandboxAIProvider,
} from './openai-family.providers';

@Injectable()
export class AIProviderRegistry {
  private readonly providers: Map<AIProviderValue, AIProvider>;

  constructor(
    openai: OpenAIProvider,
    azure: AzureOpenAIProvider,
    anthropic: AnthropicProvider,
    gemini: GeminiProvider,
    ollama: OllamaProvider,
    openrouter: OpenRouterProvider,
    groq: GroqProvider,
    sandbox: SandboxAIProvider,
  ) {
    this.providers = new Map<AIProviderValue, AIProvider>([
      ['OPENAI', openai],
      ['AZURE_OPENAI', azure],
      ['ANTHROPIC', anthropic],
      ['GOOGLE_GEMINI', gemini],
      ['OLLAMA', ollama],
      ['OPENROUTER', openrouter],
      ['GROQ', groq],
      ['SANDBOX', sandbox],
    ]);
  }

  get(provider: AIProviderValue): AIProvider {
    const impl = this.providers.get(provider);
    if (!impl) {
      throw new InvalidAIRequestException(`AI provider "${provider}" is not supported.`);
    }
    return impl;
  }

  list(): AIProvider[] {
    return [...this.providers.values()];
  }
}
