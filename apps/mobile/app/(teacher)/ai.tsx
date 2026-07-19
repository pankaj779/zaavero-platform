import React from 'react';
import { View } from 'react-native';
import { AIChat } from '../../components/ai-chat';
import { useTheme } from '../../lib/theme/theme';

export default function TeacherAiWorkspace(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AIChat
        feature="LESSON_SUMMARY"
        placeholder="Ask AI to draft lessons, quizzes, summaries…"
        intro="Teacher AI workspace. Responses respect teacher role restrictions and reuse the Phase 16 AI platform."
      />
    </View>
  );
}
