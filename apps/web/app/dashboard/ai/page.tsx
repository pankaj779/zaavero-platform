import { AIWorkspace } from '../../../components/shared/ai';

export default function DashboardAIPage(): React.JSX.Element {
  return (
    <AIWorkspace
      portal="student"
      defaultFeature="TUTOR"
      title="AI Tutor"
      description="Ask questions about your courses, lessons, and assignments with streaming answers and source citations."
    />
  );
}
