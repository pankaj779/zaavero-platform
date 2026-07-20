import type { AIProviderValue } from '../constants/ai.constants';
import {
  AIProviderNotConfiguredException,
  AIProviderRejectedException,
  AIProviderUnavailableException,
} from '../exceptions';
import type {
  AIChatMessage,
  AIChatRequest,
  AIChatResult,
  AIEmbeddingRequest,
  AIEmbeddingResult,
  AIStreamChunk,
  AIUsageMetrics,
} from './ai-provider.interface';

export interface OpenAICompatibleConfig {
  provider: AIProviderValue;
  apiKey?: string | null;
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  maxRetries?: number;
  /** Azure OpenAI uses deployment-specific paths with api-version query params. */
  azure?: {
    endpoint: string;
    apiVersion: string;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseUsage(raw: unknown): AIUsageMetrics {
  const usage =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const prompt = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : 0;
  const completion =
    typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0;
  const total =
    typeof usage.total_tokens === 'number' ? usage.total_tokens : prompt + completion;
  return { promptTokens: prompt, completionTokens: completion, totalTokens: total };
}

export class OpenAICompatibleTransport {
  constructor(private readonly config: OpenAICompatibleConfig) {}

  assertConfigured(): void {
    if (!this.config.apiKey && this.config.provider !== 'OLLAMA') {
      throw new AIProviderNotConfiguredException(
        `${this.config.provider} API key is not configured.`,
      );
    }
  }

  async chat(request: AIChatRequest): Promise<AIChatResult> {
    this.assertConfigured();
    const started = Date.now();
    const body = {
      model: request.model,
      messages: request.messages.map((m) => this.toMessage(m)),
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
      ...(request.responseFormat === 'json'
        ? { response_format: { type: 'json_object' } }
        : {}),
      stream: false,
    };
    const data = await this.requestJson<Record<string, unknown>>(
      'POST',
      this.resolvePath('chat/completions', request.model),
      body,
      request.abortSignal,
    );
    const choices = Array.isArray(data.choices) ? data.choices : [];
    const first = choices[0] as Record<string, unknown> | undefined;
    const message =
      first?.message && typeof first.message === 'object'
        ? (first.message as Record<string, unknown>)
        : {};
    const content = typeof message.content === 'string' ? message.content : '';
    return {
      provider: this.config.provider,
      model: typeof data.model === 'string' ? data.model : request.model,
      content,
      finishReason: typeof first?.finish_reason === 'string' ? first.finish_reason : null,
      usage: parseUsage(data.usage),
      latencyMs: Date.now() - started,
      raw: data,
    };
  }

  async *chatStream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    this.assertConfigured();
    const body = {
      model: request.model,
      messages: request.messages.map((m) => this.toMessage(m)),
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    };
    const response = await this.requestRaw(
      'POST',
      this.resolvePath('chat/completions', request.model),
      body,
      request.abortSignal,
    );
    if (!response.body) {
      throw new AIProviderUnavailableException('Streaming body missing.');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let usage: AIUsageMetrics | undefined;
    let finishReason: string | null = null;
    try {
      for (;;) {
        const readResult = (await reader.read()) as {
          done: boolean;
          value?: Uint8Array;
        };
        if (readResult.done) break;
        buffer += decoder.decode(readResult.value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') {
            yield { type: 'done', finishReason, usage };
            return;
          }
          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(payload) as Record<string, unknown>;
          } catch {
            continue;
          }
          if (parsed.usage) usage = parseUsage(parsed.usage);
          const choices = Array.isArray(parsed.choices) ? parsed.choices : [];
          const first = choices[0] as Record<string, unknown> | undefined;
          if (typeof first?.finish_reason === 'string') {
            finishReason = first.finish_reason;
          }
          const delta =
            first?.delta && typeof first.delta === 'object'
              ? (first.delta as Record<string, unknown>)
              : {};
          if (typeof delta.content === 'string' && delta.content.length > 0) {
            yield { type: 'token', delta: delta.content };
          }
        }
      }
      yield { type: 'done', finishReason, usage };
    } finally {
      reader.releaseLock();
    }
  }

  async embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResult> {
    this.assertConfigured();
    const started = Date.now();
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const body: Record<string, unknown> = {
      model: request.model,
      input: inputs,
    };
    if (request.dimensions) body.dimensions = request.dimensions;
    const data = await this.requestJson<Record<string, unknown>>(
      'POST',
      this.resolvePath('embeddings', request.model),
      body,
      request.abortSignal,
    );
    const rows = Array.isArray(data.data) ? data.data : [];
    const embeddings = rows.map((row) => {
      const item = row as Record<string, unknown>;
      return Array.isArray(item.embedding)
        ? (item.embedding as number[])
        : [];
    });
    return {
      provider: this.config.provider,
      model: typeof data.model === 'string' ? data.model : request.model,
      embeddings,
      usage: parseUsage(data.usage),
      latencyMs: Date.now() - started,
    };
  }

  private toMessage(message: AIChatMessage): Record<string, string> {
    return {
      role: message.role,
      content: message.content,
      ...(message.name ? { name: message.name } : {}),
    };
  }

  private async requestJson<T>(
    method: string,
    path: string,
    body: unknown,
    abortSignal?: AbortSignal,
  ): Promise<T> {
    const response = await this.requestRaw(method, path, body, abortSignal);
    const data = (await response.json()) as T;
    return data;
  }

  private async requestRaw(
    method: string,
    path: string,
    body: unknown,
    abortSignal?: AbortSignal,
  ): Promise<Response> {
    const timeoutMs = this.config.timeoutMs ?? 60_000;
    const maxRetries = this.config.maxRetries ?? 2;
    let attempt = 0;
    let lastError: unknown;
    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const onAbort = () => { controller.abort(); };
      abortSignal?.addEventListener('abort', onAbort, { once: true });
      const timer = setTimeout(() => { controller.abort(); }, timeoutMs);
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(this.config.defaultHeaders ?? {}),
        };
        if (this.config.apiKey) {
          headers.Authorization = `Bearer ${this.config.apiKey}`;
        }
        const url = path.startsWith('http')
          ? path
          : `${this.config.baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
        const response = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (response.status === 429 || response.status >= 500) {
          const text = await response.text();
          lastError = new AIProviderUnavailableException(
            this.sanitizeError(text || `HTTP ${String(response.status)}`),
          );
          attempt += 1;
          if (attempt > maxRetries) throw lastError;
          await sleep(200 * 2 ** attempt + Math.floor(Math.random() * 100));
          continue;
        }
        if (!response.ok) {
          const text = await response.text();
          throw new AIProviderRejectedException(
            this.sanitizeError(text || `HTTP ${String(response.status)}`),
          );
        }
        return response;
      } catch (error) {
        if (error instanceof AIProviderRejectedException) throw error;
        lastError = error;
        attempt += 1;
        if (attempt > maxRetries) {
          throw new AIProviderUnavailableException(
            error instanceof Error
              ? this.sanitizeError(error.message)
              : 'AI provider request failed.',
          );
        }
        await sleep(200 * 2 ** attempt + Math.floor(Math.random() * 100));
      } finally {
        clearTimeout(timer);
        abortSignal?.removeEventListener('abort', onAbort);
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new AIProviderUnavailableException('AI provider request failed.');
  }

  private resolvePath(operation: 'chat/completions' | 'embeddings', model: string): string {
    if (this.config.azure) {
      const endpoint = this.config.azure.endpoint.replace(/\/$/, '');
      const deployment = encodeURIComponent(model);
      const apiVersion = encodeURIComponent(this.config.azure.apiVersion);
      return `${endpoint}/openai/deployments/${deployment}/${operation}?api-version=${apiVersion}`;
    }
    return `/${operation}`;
  }

  private sanitizeError(message: string): string {
    return message
      .replace(/sk-[a-zA-Z0-9_-]+/g, '[redacted]')
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [redacted]')
      .slice(0, 500);
  }
}
