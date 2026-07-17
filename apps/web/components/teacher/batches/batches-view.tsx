'use client';

import { useMemo, useState } from 'react';
import {
  filterTeacherBatches,
  sortTeacherBatches,
  teacherBatches,
  teacherBatchesViewState,
  type TeacherBatchSortOption,
  type TeacherBatchStatusFilter,
  type TeacherBatchSummaryDto,
  type TeacherBatchesViewMode,
  type TeacherBatchesViewState,
} from '../../../lib/teacher';
import { BatchCollection } from './batch-collection';
import { BatchFilters } from './batch-filters';
import { BatchSearch } from './batch-search';
import { BatchStats } from './batch-stats';
import { BatchViewToggle } from './batch-view-toggle';
import { BatchesEmptyState } from './batches-empty-state';
import { BatchesErrorState } from './batches-error-state';
import { BatchesHeader } from './batches-header';
import { BatchesSkeleton } from './batches-skeleton';

export function BatchesView({
  batches = teacherBatches,
  viewState = teacherBatchesViewState,
}: {
  batches?: TeacherBatchSummaryDto[];
  viewState?: TeacherBatchesViewState;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TeacherBatchStatusFilter>('all');
  const [sort, setSort] = useState<TeacherBatchSortOption>('recently_updated');
  const [mode, setMode] = useState<TeacherBatchesViewMode>('grid');

  const visibleBatches = useMemo(() => {
    const filtered = filterTeacherBatches(batches, query, status);
    return sortTeacherBatches(filtered, sort);
  }, [batches, query, sort, status]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <BatchesHeader />
        <BatchesSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <BatchesHeader />
        <BatchesErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || batches.length === 0) {
    return (
      <div className="space-y-8">
        <BatchesHeader />
        <BatchesEmptyState variant="empty" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BatchesHeader />

      <BatchStats batches={batches} />

      <section className="space-y-4" aria-label="Batch filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <BatchSearch value={query} onChange={setQuery} />
          </div>
          <BatchFilters
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
          <div className="flex justify-end laptop:ml-auto">
            <BatchViewToggle mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </section>

      {visibleBatches.length === 0 ? (
        <BatchesEmptyState variant="no-matches" />
      ) : (
        <BatchCollection batches={visibleBatches} mode={mode} />
      )}
    </div>
  );
}
