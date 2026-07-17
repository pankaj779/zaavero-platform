import { PageHeader } from '@graphology/ui';
import { learningPageCopy } from '../../../lib/dashboard';

export function LearningHeader(): React.JSX.Element {
  return (
    <PageHeader title={learningPageCopy.title} description={learningPageCopy.description} />
  );
}
