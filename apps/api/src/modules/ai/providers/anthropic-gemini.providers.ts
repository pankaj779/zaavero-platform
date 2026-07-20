import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import {
  AIProviderNotConfiguredException,
  AIProviderRejectedException,
  AIProviderUnavailableException,
} from '../exceptions';
import type {
  AIChatRequest,
  AIChatResult,
  AIEmbeddingRequest,
  AIEmbeddingResult,
  AIProvider,
  AIProviderCapabilities,
  AIProviderHealth,
  AIStreamChunk,
  AIUsageMetrics,
} from './ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AIProvider {
  readonly name = 'ANTHROPIC' as const;
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    this.apiKey = config.get('ANTHROPIC_API_KEY', { infer: true });
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
        model: this.config.get('ANTHROPIC_MODEL', { infer: true }),
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

  async chat(request: AIChatRequest): Promise<AIChatResult> {
    if (!this.apiKey) throw new AIProviderNotConfiguredException('ANTHROPIC_API_KEY is required.');
    const started = Date.now();
    const system = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');
    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.2,
        system: system || undefined,
        messages,
      }),
      signal: request.abortSignal,
    });
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const errorMessage =
        data.error && typeof data.error === 'object'
          ? (data.error as Record<string, unknown>).message
          : undefined;
      throw new AIProviderRejectedException(
        typeof errorMessage === 'string' ? errorMessage : 'Anthropic rejected',
      );
    }
    const contentBlocks = Array.isArray(data.content) ? data.content : [];
    const text = contentBlocks
      .map((block) => {
        const item = block as Record<string, unknown>;
        return typeof item.text === 'string' ? item.text : '';
      })
      .join('');
    const usage = this.parseUsage(data.usage);
    return {
      provider: this.name,
      model: typeof data.model === 'string' ? data.model : request.model,
      content: text,
      finishReason: typeof data.stop_reason === 'string' ? data.stop_reason : null,
      usage,
      latencyMs: Date.now() - started,
      raw: data,
    };
  }

  async *chatStream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    // Anthropic SSE streaming
    if (!this.apiKey) throw new AIProviderNotConfiguredException('ANTHROPIC_API_KEY is required.');
    const system = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');
    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.2,
        system: system || undefined,
        messages,
        stream: true,
      }),
      signal: request.abortSignal,
    });
    if (!response.ok || !response.body) {
      throw new AIProviderUnavailableException('Anthropic stream failed.');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let usage: AIUsageMetrics | undefined;
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
          if (!payload) continue;
          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(payload) as Record<string, unknown>;
          } catch {
            continue;
          }
          if (parsed.type === 'content_block_delta') {
            const delta =
              parsed.delta && typeof parsed.delta === 'object'
                ? (parsed.delta as Record<string, unknown>)
                : {};
            if (typeof delta.text === 'string') {
              yield { type: 'token', delta: delta.text };
            }
          }
          if (parsed.type === 'message_delta' && parsed.usage) {
            usage = this.parseUsage(parsed.usage);
          }
          if (parsed.type === 'message_stop') {
            yield { type: 'done', usage };
            return;
          }
        }
      }
      yield { type: 'done', usage };
    } finally {
      reader.releaseLock();
    }
  }

  async structuredJson(
    request: AIChatRequest,
  ): Promise<{ data: unknown; result: AIChatResult }> {
    const result = await this.chat({
      ...request,
      messages: [
        ...request.messages,
        { role: 'system', content: 'Return a single valid JSON object only.' },
      ],
    });
    return { data: JSON.parse(result.content) as unknown, result };
  }

  embed(): Promise<AIEmbeddingResult> {
    throw new AIProviderNotConfiguredException(
      'Anthropic does not provide embeddings in this integration.',
    );
  }

  private parseUsage(raw: unknown): AIUsageMetrics {
    const usage = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const prompt = typeof usage.input_tokens === 'number' ? usage.input_tokens : 0;
    const completion = typeof usage.output_tokens === 'number' ? usage.output_tokens : 0;
    return { promptTokens: prompt, completionTokens: completion, totalTokens: prompt + completion };
  }
}

@Injectable()
export class GeminiProvider implements AIProvider {
  readonly name = 'GOOGLE_GEMINI' as const;
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    this.apiKey = config.get('GEMINI_API_KEY', { infer: true });
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
        model: this.config.get('GEMINI_MODEL', { infer: true }),
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

  async chat(request: AIChatRequest): Promise<AIChatResult> {
    if (!this.apiKey) throw new AIProviderNotConfiguredException('GEMINI_API_KEY is required.');
    const apiKey = this.apiKey;
    const started = Date.now();
    const model = request.model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
    const contents = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    const systemInstruction = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
        generationConfig: {
          temperature: request.temperature ?? 0.2,
          maxOutputTokens: request.maxTokens ?? 2048,
          ...(request.responseFormat === 'json'
            ? { responseMimeType: 'application/json' }
            : {}),
        },
      }),
      signal: request.abortSignal,
    });
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      throw new AIProviderRejectedException('Gemini rejected the request.');
    }
    const candidates = Array.isArray(data.candidates) ? data.candidates : [];
    const first = candidates[0] as Record<string, unknown> | undefined;
    const contentObj =
      first?.content && typeof first.content === 'object'
        ? (first.content as Record<string, unknown>)
        : {};
    const parts = Array.isArray(contentObj.parts) ? contentObj.parts : [];
    const text = parts
      .map((p) => {
        const part = p as Record<string, unknown>;
        return typeof part.text === 'string' ? part.text : '';
      })
      .join('');
    const usageMeta =
      data.usageMetadata && typeof data.usageMetadata === 'object'
        ? (data.usageMetadata as Record<string, unknown>)
        : {};
    const prompt = typeof usageMeta.promptTokenCount === 'number' ? usageMeta.promptTokenCount : 0;
    const completion =
      typeof usageMeta.candidatesTokenCount === 'number' ? usageMeta.candidatesTokenCount : 0;
    return {
      provider: this.name,
      model,
      content: text,
      finishReason: typeof first?.finishReason === 'string' ? first.finishReason : null,
      usage: {
        promptTokens: prompt,
        completionTokens: completion,
        totalTokens: prompt + completion,
      },
      latencyMs: Date.now() - started,
      raw: data,
    };
  }

  async *chatStream(request: AIChatRequest): AsyncIterable<AIStreamChunk> {
    // Fallback: non-stream then emit as single token for providers without stream parsing.
    const result = await this.chat(request);
    if (result.content) yield { type: 'token', delta: result.content };
    yield {
      type: 'done',
      finishReason: result.finishReason,
      usage: result.usage,
    };
  }

  async structuredJson(
    request: AIChatRequest,
  ): Promise<{ data: unknown; result: AIChatResult }> {
    const result = await this.chat({ ...request, responseFormat: 'json' });
    return { data: JSON.parse(result.content) as unknown, result };
  }

  async embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResult> {
    if (!this.apiKey) throw new AIProviderNotConfiguredException('GEMINI_API_KEY is required.');
    const started = Date.now();
    const model = request.model || 'text-embedding-004';
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const embeddings: number[][] = [];
    let promptTokens = 0;
    for (const input of inputs) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:embedContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: input }] } }),
        signal: request.abortSignal,
      });
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok) throw new AIProviderRejectedException('Gemini embedding failed.');
      const embedding =
        data.embedding && typeof data.embedding === 'object'
          ? (data.embedding as Record<string, unknown>)
          : {};
      const values = Array.isArray(embedding.values) ? (embedding.values as number[]) : [];
      embeddings.push(values);
      promptTokens += Math.ceil(input.length / 4);
    }
    return {
      provider: this.name,
      model,
      embeddings,
      usage: {
        promptTokens,
        completionTokens: 0,
        totalTokens: promptTokens,
      },
      latencyMs: Date.now() - started,
    };
  }
}
