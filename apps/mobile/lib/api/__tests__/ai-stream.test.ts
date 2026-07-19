import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { streamAIChat } from '../ai-stream';
import { tokenStorage } from '../../auth/token-storage';
import { fetch as expoFetch } from 'expo/fetch';

function sseBody(frames: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i >= frames.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(frames[i]));
      i += 1;
    },
  });
}

describe('streamAIChat', () => {
  beforeEach(() => {
    vi.spyOn(tokenStorage, 'getAccessToken').mockReturnValue('token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches typed SSE events from the AI stream endpoint', async () => {
    const onStart = vi.fn();
    const onToken = vi.fn();
    const onDone = vi.fn();

    vi.mocked(expoFetch).mockResolvedValue({
      ok: true,
      status: 200,
      body: sseBody([
        'event: start\ndata: {"conversationId":"c1"}\n\n',
        'event: token\ndata: {"delta":"Hello"}\n\n',
        'event: done\ndata: {"conversationId":"c1","messageId":"m1","finishReason":"stop"}\n\n',
      ]),
    } as unknown as Awaited<ReturnType<typeof expoFetch>>);

    await streamAIChat({
      organizationId: 'org',
      feature: 'TUTOR',
      message: 'Hi',
      handlers: { onStart, onToken, onDone },
    });

    expect(onStart).toHaveBeenCalledWith({ conversationId: 'c1' });
    expect(onToken).toHaveBeenCalledWith('Hello');
    expect(onDone).toHaveBeenCalledWith({
      conversationId: 'c1',
      messageId: 'm1',
      finishReason: 'stop',
    });
    expect(expoFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ai/student/chat/stream'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('reports an error when the stream response is not ok', async () => {
    const onError = vi.fn();
    vi.mocked(expoFetch).mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
    } as unknown as Awaited<ReturnType<typeof expoFetch>>);

    await streamAIChat({
      organizationId: 'org',
      feature: 'TUTOR',
      message: 'Hi',
      handlers: { onError },
    });

    expect(onError).toHaveBeenCalled();
  });
});
