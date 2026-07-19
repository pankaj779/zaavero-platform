// Expo SDK 52 ships a WHATWG-streaming `fetch` under `expo/fetch`, which lets us
// consume the authenticated POST SSE endpoint from Phase 16 with true backpressure
// and AbortController cancellation — the same endpoint the web app streams from.
import { fetch as expoFetch } from 'expo/fetch';
import { env } from '../config/env';
import { authService } from '../auth/auth-service';
import { tokenStorage } from '../auth/token-storage';

export interface AIStreamHandlers {
  onStart?: (payload: { conversationId: string }) => void;
  onToken?: (delta: string) => void;
  onCitation?: (citations: unknown[]) => void;
  onUsage?: (usage: { promptTokens: number; completionTokens: number; totalTokens: number }) => void;
  onDone?: (payload: { conversationId: string; messageId: string; finishReason: string | null }) => void;
  onError?: (message: string) => void;
}

export interface AIChatStreamInput {
  organizationId: string;
  feature: string;
  message: string;
  conversationId?: string;
  courseId?: string;
  lessonId?: string;
  assignmentId?: string;
  parentMessageId?: string;
  signal?: AbortSignal;
  handlers?: AIStreamHandlers;
}

function dispatch(event: string, data: unknown, handlers?: AIStreamHandlers): void {
  if (!handlers) return;
  switch (event) {
    case 'start':
      handlers.onStart?.(data as { conversationId: string });
      break;
    case 'token':
      handlers.onToken?.((data as { delta: string }).delta);
      break;
    case 'citation':
      handlers.onCitation?.((data as { citations: unknown[] }).citations);
      break;
    case 'usage':
      handlers.onUsage?.(data as { promptTokens: number; completionTokens: number; totalTokens: number });
      break;
    case 'done':
      handlers.onDone?.(data as { conversationId: string; messageId: string; finishReason: string | null });
      break;
    case 'error':
      handlers.onError?.((data as { message: string }).message);
      break;
    default:
      break;
  }
}

async function accessTokenOrRefresh(): Promise<string | null> {
  let token = tokenStorage.getAccessToken();
  if (!token) {
    const refreshed = await authService.refresh();
    if (refreshed) token = tokenStorage.getAccessToken();
  }
  return token;
}

/**
 * Streams an AI chat response over authenticated SSE (POST). Parses the same
 * typed events emitted by the backend: start, token, citation, usage, done, error.
 */
export async function streamAIChat(input: AIChatStreamInput): Promise<void> {
  const { handlers, signal, ...body } = input;
  const token = await accessTokenOrRefresh();
  if (!token) {
    handlers?.onError?.('Authentication required.');
    return;
  }

  let response: Awaited<ReturnType<typeof expoFetch>>;
  try {
    response = await expoFetch(`${env.apiBaseUrl}/ai/student/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    handlers?.onError?.('Network error while starting the stream.');
    return;
  }

  if (!response.ok || !response.body) {
    handlers?.onError?.(`Stream failed with status ${String(response.status)}.`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        let event = 'message';
        const dataLines: string[] = [];
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        }
        if (dataLines.length === 0) continue;
        try {
          dispatch(event, JSON.parse(dataLines.join('\n')), handlers);
        } catch {
          // Ignore malformed frames; the backend controls framing.
        }
      }
    }
  } catch {
    if (!signal?.aborted) handlers?.onError?.('Stream interrupted.');
  } finally {
    reader.releaseLock();
  }
}
