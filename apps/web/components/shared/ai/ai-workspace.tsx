'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from '@graphology/ui';
import 'katex/dist/katex.min.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import {
  AiApi,
  type AIConversationResponseDto,
  type AIMessageResponseDto,
  type AIFeature,
} from '../../../lib/api/ai';
import { useOrganization } from '../../../lib/auth';

export interface AIWorkspaceProps {
  portal: 'student' | 'teacher' | 'admin';
  defaultFeature?: AIFeature;
  title: string;
  description: string;
}

export function AIWorkspace({
  portal,
  defaultFeature = 'TUTOR',
  title,
  description,
}: AIWorkspaceProps): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [feature, setFeature] = useState<AIFeature>(defaultFeature);
  const [conversations, setConversations] = useState<AIConversationResponseDto[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageResponseDto[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async () => {
    if (!primaryOrganizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const page = await AiApi.listConversations({
        organizationId: primaryOrganizationId,
        feature,
        limit: 20,
      });
      setConversations(page.items);
    } catch {
      setError('Unable to load AI conversations.');
    } finally {
      setLoading(false);
    }
  }, [feature, primaryOrganizationId]);

  const loadConversation = useCallback(
    async (conversationId: string) => {
      if (!primaryOrganizationId) return;
      const detail = await AiApi.getConversation(primaryOrganizationId, conversationId);
      setActiveConversationId(conversationId);
      setMessages(detail.messages);
      setStreaming('');
    },
    [primaryOrganizationId],
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  };

  const sendMessage = async () => {
    if (!primaryOrganizationId || !draft.trim() || busy) return;
    const content = draft.trim();
    setDraft('');
    setBusy(true);
    setStreaming('');
    setError(null);
    abortRef.current = new AbortController();
    try {
      await AiApi.streamChat({
        organizationId: primaryOrganizationId,
        feature,
        message: content,
        conversationId: activeConversationId ?? undefined,
        signal: abortRef.current.signal,
        handlers: {
          onStart: ({ conversationId }) => {
            setActiveConversationId(conversationId);
          },
          onToken: (delta) => {
            setStreaming((current) => current + delta);
          },
          onDone: ({ conversationId }) => {
            void loadConversation(conversationId);
            void loadConversations();
            setStreaming('');
          },
          onError: (message) => {
            setError(message);
          },
        },
      });
    } catch (streamError: unknown) {
      if (!(streamError instanceof DOMException && streamError.name === 'AbortError')) {
        setError('AI generation failed.');
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const generateTeacherContent = async () => {
    if (!primaryOrganizationId || portal !== 'teacher' || !draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await AiApi.generate({
        organizationId: primaryOrganizationId,
        feature,
        variables: { prompt: draft.trim() },
      });
      setDraft('');
      await loadConversation(result.conversationId);
      await loadConversations();
    } catch {
      setError('AI generation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                  activeConversationId === conversation.id ? 'border-primary bg-muted' : ''
                }`}
                onClick={() => {
                  void loadConversation(conversation.id);
                }}
              >
                <div className="font-medium">{conversation.title ?? conversation.feature}</div>
                <div className="text-muted-foreground mt-1 flex items-center gap-2">
                  <Badge variant="secondary">{conversation.feature}</Badge>
                  {conversation.pinned ? <span>Pinned</span> : null}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>{portal === 'teacher' ? 'AI Workspace' : 'AI Tutor'}</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                value={feature}
                onChange={(event) => {
                  setFeature(event.target.value as AIFeature);
                }}
                className="w-48"
              />
              {busy ? (
                <Button variant="outline" onClick={stopGeneration}>
                  Stop
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="max-h-[420px] space-y-4 overflow-y-auto rounded-md border p-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className="text-xs uppercase text-muted-foreground">{message.role}</div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {streaming ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeKatex]}>
                    {streaming}
                  </ReactMarkdown>
                </div>
              ) : null}
            </div>
            <Textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
              }}
              placeholder={
                portal === 'teacher'
                  ? 'Ask or describe what you want to generate…'
                  : 'Ask a question about your course…'
              }
              rows={4}
            />
            <div className="flex gap-2">
              <Button disabled={busy || !draft.trim()} onClick={() => {
                void sendMessage();
              }}>
                {busy ? 'Generating…' : 'Send'}
              </Button>
              {portal === 'teacher' ? (
                <Button
                  variant="secondary"
                  disabled={busy || !draft.trim()}
                  onClick={() => {
                    void generateTeacherContent();
                  }}
                >
                  Generate
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
