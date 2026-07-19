import React from 'react';
import { View } from 'react-native';
import { AIChat } from '../../components/ai-chat';
import { useTheme } from '../../lib/theme/theme';

export default function StudentAiTutor(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AIChat
        feature="TUTOR"
        placeholder="Ask your AI tutor…"
        intro="I'm your AI tutor. Ask about your lessons, get explanations, or practice questions. Responses are grounded in your course material where available."
      />
    </View>
  );
}
