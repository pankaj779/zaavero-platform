'use client';

import { PageHeader } from '@graphology/ui';
import { studentCoursesPageCopy } from './copy';

export function StudentCoursesHeader(): React.JSX.Element {
  return (
    <PageHeader
      title={studentCoursesPageCopy.title}
      description={studentCoursesPageCopy.description}
    />
  );
}
