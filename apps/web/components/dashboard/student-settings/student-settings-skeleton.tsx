import { Skeleton } from '@graphology/ui';
import { studentSettingsCopy } from './copy';

export function StudentSettingsSkeleton(): React.JSX.Element {
  return (
    <div
      className="mx-auto grid max-w-3xl gap-4"
      aria-busy="true"
      aria-label={studentSettingsCopy.loadingLabel}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}
