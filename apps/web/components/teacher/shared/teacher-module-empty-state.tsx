import type { IconName } from '../../../lib/constants/icons';
import { icons } from '../../../lib/constants';
import { DashboardEmptyState } from '../../dashboard/shared';

/**
 * Shared empty state for Teacher Portal modules.
 * Pass resolved title/description for the active variant at the call site.
 */
export function TeacherModuleEmptyState({
  title,
  description,
  icon = 'book',
}: {
  title: string;
  description: string;
  icon?: IconName;
}): React.JSX.Element {
  const Icon = icons[icon];

  return (
    <DashboardEmptyState
      title={title}
      description={description}
      illustration={<Icon className="h-7 w-7" aria-hidden />}
    />
  );
}
