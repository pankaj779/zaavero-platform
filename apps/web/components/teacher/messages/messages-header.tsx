import { PageHeader } from '@graphology/ui';
import { teacherMessagesPageCopy } from '../../../lib/teacher';

export function MessagesHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={teacherMessagesPageCopy.title}
      description={teacherMessagesPageCopy.description}
    />
  );
}
