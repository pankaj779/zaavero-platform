'use client';

import { Button } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import { teacherBatchesPageCopy, type TeacherBatchesViewMode } from '../../../lib/teacher';

const GridIcon = icons.grid;
const ListIcon = icons.list;

export function BatchViewToggle({
  mode,
  onModeChange,
}: {
  mode: TeacherBatchesViewMode;
  onModeChange: (mode: TeacherBatchesViewMode) => void;
}): React.JSX.Element {
  const copy = teacherBatchesPageCopy;

  return (
    <div
      role="group"
      aria-label={copy.viewModeLabel}
      className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface p-1"
    >
      <Button
        type="button"
        variant={mode === 'grid' ? 'secondary' : 'ghost'}
        size="icon-sm"
        aria-label={copy.gridViewLabel}
        aria-pressed={mode === 'grid'}
        onClick={() => {
          onModeChange('grid');
        }}
      >
        <GridIcon className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant={mode === 'list' ? 'secondary' : 'ghost'}
        size="icon-sm"
        aria-label={copy.listViewLabel}
        aria-pressed={mode === 'list'}
        onClick={() => {
          onModeChange('list');
        }}
      >
        <ListIcon className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
