import { AIWorkspace } from '../../../components/shared/ai';

export default function TeacherAIPage(): React.JSX.Element {
  return (
    <AIWorkspace
      portal="teacher"
      defaultFeature="QUIZ_GENERATOR"
      title="AI Studio"
      description="Generate summaries, quizzes, announcements, and teaching copy with organization-safe AI workflows."
    />
  );
}
