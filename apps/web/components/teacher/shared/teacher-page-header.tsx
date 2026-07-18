import { PageHeader } from '@graphology/ui';

/** Shared page header for Teacher Portal modules — thin PageHeader wrapper. */
export function TeacherPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.JSX.Element {
  return <PageHeader title={title} description={description} />;
}
