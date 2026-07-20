import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import { DEFAULT_CHAT_MODEL, DEFAULT_EMBEDDING_MODEL } from '../constants/ai.constants';
import {
  AIProviderNotConfiguredException,
  AISandboxForbiddenException,
} from '../exceptions';
import type {
  AIChatRequest,
  AIChatResult,
  AIEmbeddingRequest,
  AIEmbeddingResult,
  AIModerationRequest,
  AIModerationResult,
  AIProvider,
  AIProviderCapabilities,
  AIProviderHealth,
  AIStreamChunk,
} from './ai-provider.interface';
import { OpenAICompatibleTransport } from './openai-compatible.transport';

@Injectable()
export class OpenAIProvider implements AIProvider {
  readonly name = 'OPENAI' as const;
  private readonly transport: OpenAICompatibleTransport;
  private readonly apiKey: string | undefined;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.apiKey = config.get('OPENAI_API_KEY', { infer: true }) ?? undefined;
    this.transport = new OpenAICompatibleTransport({
      provider: this.name,
      apiKey: this.apiKey,
      baseUrl: config.get('OPENAI_BASE_URL', { infer: true }) || 'https://api.openai.com/v1',
      timeoutMs: config.get('AI_TIMEOUT_MS', { infer: true }),
      maxRetries: config.get('AI_MAX_RETRIES', { infer: true }),
    });
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey?.trim());
  }

  capabilities(): AIProviderCapabilities {
    return {
      chat: true,
      streaming: true,
      embeddings: true,
      moderation: true,
      structuredJson: true,
    };
  }

  async health(): Promise<AIProviderHealth> {
    try {
      const started = Date.now();
      await this.transport.chat({
        model: DEFAULT_CHAT_MODEL,
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1,
      });
      return { provider: this.name, healthy: true, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        provider: this.name,
        healthy: false,
        message: error instanceof Error ? error.message : 'unhealthy',
      };
    }
  }

  chat(request: AIChatRequest): Promise<AIChatResult> {
    return this.transport.chat(request);
  }

  chatStream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    return this.transport.chatStream(request);
  }

  async structuredJson(
    request: AIChatRequest,
  ): Promise<{ data: unknown; result: AIChatResult }> {
    const result = await this.transport.chat({ ...request, responseFormat: 'json' });
    return { data: JSON.parse(result.content) as unknown, result };
  }

  embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResult> {
    return this.transport.embed({
      ...request,
      model: request.model || DEFAULT_EMBEDDING_MODEL,
    });
  }

  moderate(request: AIModerationRequest): Promise<AIModerationResult> {
    void request;
    return Promise.resolve({ flagged: false, categories: {}, scores: {} });
  }
}

@Injectable()
export class AzureOpenAIProvider implements AIProvider {
  readonly name = 'AZURE_OPENAI' as const;
  private readonly transport: OpenAICompatibleTransport;
  private readonly deployment: string;
  private readonly embeddingDeployment: string;
  private readonly apiKey: string | undefined;
  private readonly endpoint: string | undefined;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.endpoint = config.get('AZURE_OPENAI_ENDPOINT', { infer: true }) ?? undefined;
    this.apiKey = config.get('AZURE_OPENAI_API_KEY', { infer: true }) ?? undefined;
    const apiVersion = config.get('AZURE_OPENAI_API_VERSION', { infer: true });
    this.deployment =
      config.get('AZURE_OPENAI_DEPLOYMENT', { infer: true }) || DEFAULT_CHAT_MODEL;
    this.embeddingDeployment =
      config.get('AZURE_OPENAI_EMBEDDING_DEPLOYMENT', { infer: true }) ||
      DEFAULT_EMBEDDING_MODEL;
    this.transport = new OpenAICompatibleTransport({
      provider: this.name,
      apiKey: this.apiKey,
      baseUrl: this.endpoint ?? '',
      defaultHeaders: {
        'api-key': this.apiKey ?? '',
      },
      timeoutMs: config.get('AI_TIMEOUT_MS', { infer: true }),
      maxRetries: config.get('AI_MAX_RETRIES', { infer: true }),
      azure: this.endpoint
        ? { endpoint: this.endpoint, apiVersion }
        : undefined,
    });
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey?.trim() && this.endpoint?.trim());
  }

  capabilities(): AIProviderCapabilities {
    return {
      chat: true,
      streaming: true,
      embeddings: true,
      moderation: false,
      structuredJson: true,
    };
  }

  async health(): Promise<AIProviderHealth> {
    try {
      const started = Date.now();
      await this.chat({
        model: this.deployment,
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1,
      });
      return { provider: this.name, healthy: true, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        provider: this.name,
        healthy: false,
        message: error instanceof Error ? error.message : 'unhealthy',
      };
    }
  }

  chat(request: AIChatRequest): Promise<AIChatResult> {
    return this.transport.chat({ ...request, model: request.model || this.deployment });
  }

  chatStream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    return this.transport.chatStream({ ...request, model: request.model || this.deployment });
  }

  async structuredJson(
    request: AIChatRequest,
  ): Promise<{ data: unknown; result: AIChatResult }> {
    const result = await this.transport.chat({
      ...request,
      model: request.model || this.deployment,
      responseFormat: 'json',
    });
    return { data: JSON.parse(result.content) as unknown, result };
  }

  embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResult> {
    return this.transport.embed({
      ...request,
      model: request.model || this.embeddingDeployment,
    });
  }
}

@Injectable()
export class OpenRouterProvider implements AIProvider {
  readonly name = 'OPENROUTER' as const;
  private readonly transport: OpenAICompatibleTransport;
  private readonly apiKey: string | undefined;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.apiKey = config.get('OPENROUTER_API_KEY', { infer: true }) ?? undefined;
    this.transport = new OpenAICompatibleTransport({
      provider: this.name,
      apiKey: this.apiKey,
      baseUrl: 'https://openrouter.ai/api/v1',
      timeoutMs: config.get('AI_TIMEOUT_MS', { infer: true }),
      maxRetries: config.get('AI_MAX_RETRIES', { infer: true }),
    });
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey?.trim());
  }

  capabilities(): AIProviderCapabilities {
    return {
      chat: true,
      streaming: true,
      embeddings: true,
      moderation: false,
      structuredJson: true,
    };
  }

  async health(): Promise<AIProviderHealth> {
    try {
      const started = Date.now();
      await this.chat({
        model: DEFAULT_CHAT_MODEL,
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1,
      });
      return { provider: this.name, healthy: true, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        provider: this.name,
        healthy: false,
        message: error instanceof Error ? error.message : 'unhealthy',
      };
    }
  }

  chat(request: AIChatRequest): Promise<AIChatResult> {
    return this.transport.chat(request);
  }

  chatStream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    return this.transport.chatStream(request);
  }

  async structuredJson(
    request: AIChatRequest,
  ): Promise<{ data: unknown; result: AIChatResult }> {
    const result = await this.transport.chat({ ...request, responseFormat: 'json' });
    return { data: JSON.parse(result.content) as unknown, result };
  }

  embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResult> {
    return this.transport.embed(request);
  }
}

@Injectable()
export class GroqProvider implements AIProvider {
  readonly name = 'GROQ' as const;
  private readonly transport: OpenAICompatibleTransport;
  private readonly apiKey: string | undefined;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.apiKey = config.get('GROQ_API_KEY', { infer: true }) ?? undefined;
    this.transport = new OpenAICompatibleTransport({
      provider: this.name,
      apiKey: this.apiKey,
      baseUrl: 'https://api.groq.com/openai/v1',
      timeoutMs: config.get('AI_TIMEOUT_MS', { infer: true }),
      maxRetries: config.get('AI_MAX_RETRIES', { infer: true }),
    });
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey?.trim());
  }

  capabilities(): AIProviderCapabilities {
    return {
      chat: true,
      streaming: true,
      embeddings: false,
      moderation: false,
      structuredJson: true,
    };
  }

  async health(): Promise<AIProviderHealth> {
    try {
      const started = Date.now();
      await this.chat({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1,
      });
      return { provider: this.name, healthy: true, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        provider: this.name,
        healthy: false,
        message: error instanceof Error ? error.message : 'unhealthy',
      };
    }
  }

  chat(request: AIChatRequest): Promise<AIChatResult> {
    return this.transport.chat(request);
  }

  chatStream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    return this.transport.chatStream(request);
  }

  async structuredJson(
    request: AIChatRequest,
  ): Promise<{ data: unknown; result: AIChatResult }> {
    const result = await this.transport.chat({ ...request, responseFormat: 'json' });
    return { data: JSON.parse(result.content) as unknown, result };
  }

  embed(_request: AIEmbeddingRequest): Promise<AIEmbeddingResult> {
    return Promise.reject(
      new AIProviderNotConfiguredException(
        'Groq does not provide embeddings in this integration.',
      ),
    );
  }
}

@Injectable()
export class OllamaProvider implements AIProvider {
  readonly name = 'OLLAMA' as const;
  private readonly transport: OpenAICompatibleTransport;
  private readonly baseUrl: string;

  constructor(config: ConfigService<EnvConfig, true>) {
    this.baseUrl = config.get('OLLAMA_BASE_URL', { infer: true }).replace(/\/$/, '');
    this.transport = new OpenAICompatibleTransport({
      provider: this.name,
      apiKey: 'ollama',
      baseUrl: `${this.baseUrl}/v1`,
      timeoutMs: config.get('AI_TIMEOUT_MS', { infer: true }),
      maxRetries: config.get('AI_MAX_RETRIES', { infer: true }),
    });
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl.trim());
  }

  capabilities(): AIProviderCapabilities {
    return {
      chat: true,
      streaming: true,
      embeddings: true,
      moderation: false,
      structuredJson: true,
    };
  }

  async health(): Promise<AIProviderHealth> {
    try {
      const started = Date.now();
      await this.chat({
        model: 'llama3.2',
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 1,
      });
      return { provider: this.name, healthy: true, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        provider: this.name,
        healthy: false,
        message: error instanceof Error ? error.message : 'unhealthy',
      };
    }
  }

  chat(request: AIChatRequest): Promise<AIChatResult> {
    return this.transport.chat(request);
  }

  chatStream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    return this.transport.chatStream(request);
  }

  async structuredJson(
    request: AIChatRequest,
  ): Promise<{ data: unknown; result: AIChatResult }> {
    const result = await this.transport.chat({
      ...request,
      messages: [
        ...request.messages,
        { role: 'system', content: 'Respond with valid JSON only.' },
      ],
    });
    return { data: JSON.parse(result.content) as unknown, result };
  }

  embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResult> {
    return this.transport.embed(request);
  }
}

@Injectable()
export class SandboxAIProvider implements AIProvider {
  readonly name = 'SANDBOX' as const;
  readonly captured: unknown[] = [];

  isConfigured(): boolean {
    return true;
  }

  capabilities(): AIProviderCapabilities {
    return {
      chat: false,
      streaming: false,
      embeddings: false,
      moderation: false,
      structuredJson: false,
    };
  }

  health(): Promise<AIProviderHealth> {
    return Promise.resolve({
      provider: this.name,
      healthy: true,
      latencyMs: 0,
      message: 'test-only',
    });
  }

  chat(request: AIChatRequest): Promise<AIChatResult> {
    this.captured.push({ op: 'chat', request });
    throw new AISandboxForbiddenException();
  }

  async *chatStream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    this.captured.push({ op: 'chatStream', request });
    await Promise.resolve();
    yield { type: 'error', error: 'Sandbox cannot generate user-facing responses.' };
    throw new AISandboxForbiddenException();
  }

  structuredJson(request: AIChatRequest): Promise<{ data: never; result: AIChatResult }> {
    this.captured.push({ op: 'structuredJson', request });
    throw new AISandboxForbiddenException();
  }

  embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResult> {
    this.captured.push({ op: 'embed', request });
    throw new AISandboxForbiddenException();
  }
}
