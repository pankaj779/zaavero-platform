import { PageHeader } from '@graphology/ui';

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}): React.JSX.Element {
  return <PageHeader title={title} description={description} actions={actions} />;
}
