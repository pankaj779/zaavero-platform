'use client';

import { Button } from '@graphology/ui';
import { icons } from '../../../lib/constants';

const GridIcon = icons.grid;
const ListIcon = icons.list;

/**
 * Shared accessible grid/list toggle for Teacher Portal collection workspaces.
 */
export function TeacherGridListToggle({
  mode,
  onModeChange,
  viewModeLabel,
  gridViewLabel,
  listViewLabel,
}: {
  mode: 'grid' | 'list';
  onModeChange: (mode: 'grid' | 'list') => void;
  viewModeLabel: string;
  gridViewLabel: string;
  listViewLabel: string;
}): React.JSX.Element {
  return (
    <div
      role="group"
      aria-label={viewModeLabel}
      className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface p-1"
    >
      <Button
        type="button"
        variant={mode === 'grid' ? 'secondary' : 'ghost'}
        size="icon-sm"
        aria-label={gridViewLabel}
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
        aria-label={listViewLabel}
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
