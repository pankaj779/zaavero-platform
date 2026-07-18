'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BatchApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  toBatchApiStatus,
  toBatchListSort,
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

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function BatchesView({
  initialBatches,
  initialViewState,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialBatches?: TeacherBatchSummaryDto[];
  initialViewState?: TeacherBatchesViewState;
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<TeacherBatchStatusFilter>('all');
  const [sort, setSort] = useState<TeacherBatchSortOption>('recently_updated');
  const [mode, setMode] = useState<TeacherBatchesViewMode>('grid');

  const [viewState, setViewState] = useState<TeacherBatchesViewState>(
    initialViewState ?? 'loading',
  );
  const [batches, setBatches] = useState<TeacherBatchSummaryDto[]>(initialBatches ?? []);
  const [statsBatches, setStatsBatches] = useState<TeacherBatchSummaryDto[]>(initialBatches ?? []);
  const hasLoadedRef = useRef(initialViewState !== undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadStats = useCallback(
    async (signal: AbortSignal) => {
      const result = await BatchApi.getBatches({
        organizationId: primaryOrganizationId ?? undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        enrichCourses: false,
      });
      if (signal.aborted) {
        return;
      }
      setStatsBatches(result.items);
    },
    [primaryOrganizationId],
  );

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const { sortBy, sortOrder } = toBatchListSort(sort);
      const result = await BatchApi.getBatches({
        organizationId: primaryOrganizationId ?? undefined,
        search: debouncedQuery || undefined,
        status: toBatchApiStatus(status),
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      setBatches(result.items);

      const filtersActive = debouncedQuery.trim().length > 0 || status !== 'all';
      if (result.items.length === 0 && !filtersActive) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [debouncedQuery, primaryOrganizationId, sort, status],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialBatches !== undefined) {
      return;
    }

    const controller = new AbortController();
    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) {
      setViewState('loading');
    }

    void (async () => {
      try {
        if (isFirstLoad) {
          await Promise.all([loadStats(controller.signal), loadList(controller.signal)]);
        } else {
          await loadList(controller.signal);
        }
        hasLoadedRef.current = true;
      } catch {
        if (!controller.signal.aborted) {
          setViewState('error');
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [initialBatches, initialViewState, loadList, loadStats]);

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

  if (viewState === 'empty') {
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

      <BatchStats batches={statsBatches} />

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

      {batches.length === 0 ? (
        <BatchesEmptyState variant="no-matches" />
      ) : (
        <BatchCollection batches={batches} mode={mode} />
      )}
    </div>
  );
}
