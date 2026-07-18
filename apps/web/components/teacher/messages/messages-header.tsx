import { teacherMessagesPageCopy } from '../../../lib/teacher';
import { TeacherPageHeader } from '../shared';

export function MessagesHeader({
  pageCopy,
}: {
  pageCopy?: {
    title?: string;
    description?: string;
  };
} = {}): React.JSX.Element {
  const copy = { ...teacherMessagesPageCopy, ...pageCopy };
  return <TeacherPageHeader title={copy.title} description={copy.description} />;
}
