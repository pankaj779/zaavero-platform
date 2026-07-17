'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  assignments,
  assignmentsViewState,
  filterAssignments,
  getUpcomingDeadline,
  sortAssignments,
  type AssignmentDto,
  type AssignmentSortOption,
  type AssignmentStatusFilter,
  type AssignmentsViewState,
} from '../../../lib/dashboard';
import { AssignmentCard } from './assignment-card';
import { AssignmentDetails } from './assignment-details';
import { AssignmentFilter } from './assignment-filter';
import { AssignmentSearch } from './assignment-search';
import { AssignmentStats } from './assignment-stats';
import { AssignmentsEmptyState } from './assignments-empty-state';
import { AssignmentsErrorState } from './assignments-error-state';
import { AssignmentsHeader } from './assignments-header';
import { AssignmentsSkeleton } from './assignments-skeleton';
import { UpcomingDeadlineCard } from './upcoming-deadline-card';

export function AssignmentsView({
  items = assignments,
  viewState = assignmentsViewState,
}: {
  items?: AssignmentDto[];
  viewState?: AssignmentsViewState;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<AssignmentStatusFilter>('all');
  const [sort, setSort] = useState<AssignmentSortOption>('due_soon');
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);

  const visibleItems = useMemo(() => {
    const filtered = filterAssignments(items, query, status);
    return sortAssignments(filtered, sort);
  }, [items, query, sort, status]);

  useEffect(() => {
    if (visibleItems.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !visibleItems.some((item) => item.id === selectedId)) {
      setSelectedId(visibleItems[0]?.id ?? null);
    }
  }, [selectedId, visibleItems]);

  const selectedAssignment =
    visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0] ?? null;
  const upcoming = getUpcomingDeadline(items);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <AssignmentsHeader />
        <AssignmentsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <AssignmentsHeader />
        <AssignmentsErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || items.length === 0) {
    return (
      <div className="space-y-8">
        <AssignmentsHeader />
        <AssignmentsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AssignmentsHeader />

      <AssignmentStats items={items} />

      <UpcomingDeadlineCard assignment={upcoming} />

      <section className="space-y-4" aria-label="Assignment filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <AssignmentSearch value={query} onChange={setQuery} />
          </div>
          <AssignmentFilter
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
        </div>
      </section>

      <div className="grid gap-6 laptop:grid-cols-[minmax(0,1fr)_22rem] laptop:items-start">
        <section className="min-w-0 space-y-4" aria-label="Your assignments">
          {visibleItems.length === 0 ? (
            <p className="text-small text-muted-foreground">
              No assignments match your search or filters.
            </p>
          ) : (
            <ul className="grid gap-4 tablet:grid-cols-2">
              {visibleItems.map((assignment) => (
                <li key={assignment.id}>
                  <AssignmentCard
                    assignment={assignment}
                    selected={assignment.id === selectedAssignment?.id}
                    onSelect={setSelectedId}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="laptop:sticky laptop:top-20" aria-label="Assignment Details">
          <AssignmentDetails assignment={selectedAssignment} />
        </aside>
      </div>
    </div>
  );
}
