import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { streamAIChat } from '../lib/api/ai-stream';
import { useOrganizationId } from '../lib/hooks/use-org';
import { AppText, Button, Card, Row } from './ui';
import { useTheme } from '../lib/theme/theme';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Reusable streaming AI chat surface. Talks to the Phase 16 SSE endpoint via
 * the shared stream client. `feature` selects the backend prompt/role policy
 * (e.g. TUTOR for students, LESSON_SUMMARY / QUIZ_GENERATION for teachers).
 */
export function AIChat({
  feature,
  placeholder = 'Ask anything…',
  intro,
  courseId,
  lessonId,
}: {
  feature: string;
  placeholder?: string;
  intro?: string;
  courseId?: string;
  lessonId?: string;
}): React.JSX.Element {
  const theme = useTheme();
  const organizationId = useOrganizationId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationId = useRef<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput('');

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    await streamAIChat({
      organizationId,
      feature,
      message: text,
      conversationId: conversationId.current,
      courseId,
      lessonId,
      signal: controller.signal,
      handlers: {
        onStart: ({ conversationId: cid }) => {
          conversationId.current = cid;
        },
        onToken: (delta) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
          );
          scrollRef.current?.scrollToEnd({ animated: true });
        },
        onError: (msg) => setError(msg),
      },
    });

    setStreaming(false);
    abortRef.current = null;
  }, [input, streaming, organizationId, feature, courseId, lessonId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing(4), gap: theme.spacing(3) }}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && intro ? (
          <Card>
            <AppText variant="caption">{intro}</AppText>
          </Card>
        ) : null}

        {messages.map((message) => (
          <View
            key={message.id}
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              backgroundColor:
                message.role === 'user' ? theme.colors.primary : theme.colors.surface,
              borderRadius: theme.radius.lg,
              borderWidth: message.role === 'assistant' ? 1 : 0,
              borderColor: theme.colors.border,
              padding: theme.spacing(3),
            }}
          >
            <AppText
              variant="body"
              color={message.role === 'user' ? theme.colors.primaryText : theme.colors.text}
            >
              {message.content || (streaming ? '…' : '')}
            </AppText>
          </View>
        ))}

        {error ? (
          <AppText variant="caption" color={theme.colors.danger}>
            {error}
          </AppText>
        ) : null}
      </ScrollView>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          padding: theme.spacing(3),
          gap: theme.spacing(2),
        }}
      >
        <Row gap={2} align="flex-end">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            multiline
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 44,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              paddingHorizontal: theme.spacing(3),
              paddingVertical: theme.spacing(2.5),
              color: theme.colors.text,
            }}
          />
          {streaming ? (
            <View style={{ paddingBottom: theme.spacing(1) }}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null}
        </Row>
        {streaming ? (
          <Button title="Stop" variant="secondary" onPress={stop} />
        ) : (
          <Button title="Send" onPress={() => void send()} disabled={!input.trim()} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
