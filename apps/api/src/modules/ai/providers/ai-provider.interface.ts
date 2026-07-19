import type { AIProviderValue } from '../constants/ai.constants';

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface AIUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
}

export interface AIChatRequest {
  model: string;
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  abortSignal?: AbortSignal;
  responseFormat?: 'text' | 'json';
}

export interface AIChatResult {
  provider: AIProviderValue;
  model: string;
  content: string;
  finishReason: string | null;
  usage: AIUsageMetrics;
  latencyMs: number;
  raw?: unknown;
}

export interface AIStreamChunk {
  type: 'token' | 'done' | 'error';
  delta?: string;
  finishReason?: string | null;
  usage?: AIUsageMetrics;
  error?: string;
}

export interface AIEmbeddingRequest {
  model: string;
  input: string | string[];
  abortSignal?: AbortSignal;
  dimensions?: number;
}

export interface AIEmbeddingResult {
  provider: AIProviderValue;
  model: string;
  embeddings: number[][];
  usage: AIUsageMetrics;
  latencyMs: number;
}

export interface AIModerationRequest {
  input: string;
  abortSignal?: AbortSignal;
}

export interface AIModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
}

export interface AIProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  embeddings: boolean;
  moderation: boolean;
  structuredJson: boolean;
}

export interface AIProviderHealth {
  provider: AIProviderValue;
  healthy: boolean;
  latencyMs?: number;
  message?: string;
}

/**
 * Provider-agnostic AI contract. Business services never branch on vendor names.
 */
export interface AIProvider {
  readonly name: AIProviderValue;
  isConfigured(): boolean;
  capabilities(): AIProviderCapabilities;
  health(): Promise<AIProviderHealth>;
  chat(request: AIChatRequest): Promise<AIChatResult>;
  chatStream(request: AIChatRequest): AsyncIterable<AIStreamChunk>;
  structuredJson<T = unknown>(request: AIChatRequest): Promise<{ data: T; result: AIChatResult }>;
  embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResult>;
  moderate?(request: AIModerationRequest): Promise<AIModerationResult>;
}
