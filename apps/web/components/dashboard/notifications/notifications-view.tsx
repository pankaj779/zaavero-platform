'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  filterNotifications,
  notifications,
  notificationsPageCopy,
  notificationsViewState,
  sortNotifications,
  type NotificationDto,
  type NotificationSortOption,
  type NotificationStatusFilter,
  type NotificationsViewState,
} from '../../../lib/dashboard';
import { NotificationCard } from './notification-card';
import { NotificationDetails } from './notification-details';
import { NotificationFilter } from './notification-filter';
import { NotificationSearch } from './notification-search';
import { NotificationStats } from './notification-stats';
import { NotificationsEmptyState } from './notifications-empty-state';
import { NotificationsErrorState } from './notifications-error-state';
import { NotificationsHeader } from './notifications-header';
import { NotificationsSkeleton } from './notifications-skeleton';

export function NotificationsView({
  items = notifications,
  viewState = notificationsViewState,
}: {
  items?: NotificationDto[];
  viewState?: NotificationsViewState;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<NotificationStatusFilter>('all');
  const [sort, setSort] = useState<NotificationSortOption>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleItems = useMemo(() => {
    const filtered = filterNotifications(items, query, status);
    return sortNotifications(filtered, sort);
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

  const selectedNotification =
    visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0] ?? null;

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <NotificationsHeader />
        <NotificationsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <NotificationsHeader />
        <NotificationsErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || items.length === 0) {
    return (
      <div className="space-y-8">
        <NotificationsHeader />
        <NotificationsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <NotificationsHeader />

      <NotificationStats items={items} />

      <section className="space-y-4" aria-label="Notification filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <NotificationSearch value={query} onChange={setQuery} />
          </div>
          <NotificationFilter
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
        </div>
      </section>

      <div className="grid gap-6 laptop:grid-cols-[minmax(0,1fr)_22rem] laptop:items-start">
        <section className="min-w-0 space-y-4" aria-label={notificationsPageCopy.listLabel}>
          {visibleItems.length === 0 ? (
            <p className="text-small text-muted-foreground">
              No notifications match your search or filters.
            </p>
          ) : (
            <ul className="grid gap-4">
              {visibleItems.map((notification) => (
                <li key={notification.id}>
                  <NotificationCard
                    notification={notification}
                    selected={notification.id === selectedNotification?.id}
                    onSelect={setSelectedId}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside
          className="laptop:sticky laptop:top-20"
          aria-label={notificationsPageCopy.detailsTitle}
        >
          <NotificationDetails notification={selectedNotification} />
        </aside>
      </div>
    </div>
  );
}
