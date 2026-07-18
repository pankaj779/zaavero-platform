'use client';

import { Button, PageHeader } from '@graphology/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NotificationApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  filterTeacherNotifications,
  getTeacherNotificationStats,
  sortTeacherNotifications,
  teacherNotificationsPageCopy,
  toNotificationApiType,
  toNotificationApiUnreadOnly,
  toNotificationListSort,
  type TeacherNotificationDto,
  type TeacherNotificationSortOption,
  type TeacherNotificationStatusFilter,
  type TeacherNotificationsViewState,
} from '../../../lib/teacher';
import {
  NotificationFilter,
  NotificationSearch,
  NotificationsSkeleton,
} from '../../dashboard/notifications';
import { DashboardStatGrid } from '../../dashboard/shared';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../shared';
import { TeacherNotificationCard } from './notification-card';
import { TeacherNotificationDetails } from './notification-details';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

export type NotificationsPortalMode = 'teacher' | 'student';

export function NotificationsView({
  initialItems,
  initialViewState,
  portalMode = 'teacher',
  pageCopy,
}: {
  /** Optional test override; supplying both values skips network loading. */
  initialItems?: TeacherNotificationDto[];
  initialViewState?: TeacherNotificationsViewState;
  portalMode?: NotificationsPortalMode;
  pageCopy?: {
    title?: string;
    description?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    errorTitle?: string;
    errorDescription?: string;
  };
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<TeacherNotificationStatusFilter>('all');
  const [sort, setSort] = useState<TeacherNotificationSortOption>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<TeacherNotificationDto[]>(initialItems ?? []);
  const [viewState, setViewState] = useState<TeacherNotificationsViewState>(
    initialViewState ?? 'loading',
  );
  const [marking, setMarking] = useState(false);
  const hasLoadedRef = useRef(initialViewState !== undefined);
  const copy = { ...teacherNotificationsPageCopy, ...pageCopy };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadList = useCallback(
    async (signal?: AbortSignal) => {
      const { sortBy, sortOrder } = toNotificationListSort(sort);
      const result = await NotificationApi.getNotifications({
        organizationId: primaryOrganizationId ?? undefined,
        channel: 'IN_APP',
        type: toNotificationApiType(status),
        unreadOnly: toNotificationApiUnreadOnly(status),
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });

      if (signal?.aborted) {
        return;
      }

      setItems(result.items);
      const filterActive = status !== 'all';
      setViewState(result.meta.total === 0 && !filterActive ? 'empty' : 'populated');
      hasLoadedRef.current = true;
    },
    [primaryOrganizationId, sort, status],
  );

  useEffect(() => {
    if (initialItems !== undefined && initialViewState !== undefined) {
      return;
    }

    const controller = new AbortController();
    if (!hasLoadedRef.current) {
      setViewState('loading');
    }

    void (async () => {
      try {
        await loadList(controller.signal);
      } catch {
        if (!controller.signal.aborted) {
          setViewState('error');
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [initialItems, initialViewState, loadList]);

  const visibleItems = useMemo(() => {
    const filtered = filterTeacherNotifications(items, debouncedQuery, status);
    return sortTeacherNotifications(filtered, sort);
  }, [debouncedQuery, items, sort, status]);

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

  const unreadCount = items.filter((item) => item.readAt === null).length;

  async function markRead(id: string): Promise<void> {
    setMarking(true);
    try {
      const updated = await NotificationApi.markNotificationRead(id);
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...updated } : item)),
      );
    } finally {
      setMarking(false);
    }
  }

  async function markAllRead(): Promise<void> {
    setMarking(true);
    try {
      await NotificationApi.markAllNotificationsRead(primaryOrganizationId ?? undefined);
      const now = new Date().toISOString();
      setItems((current) =>
        current.map((item) => (item.readAt === null ? { ...item, readAt: now } : item)),
      );
    } finally {
      setMarking(false);
    }
  }

  const header = (
    <PageHeader
      title={copy.title}
      description={copy.description}
      actions={
        unreadCount > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={marking}
            aria-label={
              portalMode === 'student'
                ? 'Mark all notifications as read'
                : 'Mark all my notifications as read'
            }
            onClick={() => {
              void markAllRead();
            }}
          >
            Mark all read
          </Button>
        ) : undefined
      }
    />
  );

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        {header}
        <NotificationsSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        {header}
        <TeacherModuleErrorState title={copy.errorTitle} description={copy.errorDescription} />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        {header}
        <TeacherModuleEmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {header}

      <DashboardStatGrid stats={getTeacherNotificationStats(items)} ariaLabel={copy.statsLabel} />

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
        <section className="min-w-0 space-y-4" aria-label={copy.listLabel}>
          {visibleItems.length === 0 ? (
            <p className="text-small text-muted-foreground">
              No notifications match your search or filters.
            </p>
          ) : (
            <ul className="grid gap-4">
              {visibleItems.map((notification) => (
                <li key={notification.id}>
                  <TeacherNotificationCard
                    notification={notification}
                    selected={notification.id === selectedNotification?.id}
                    marking={marking}
                    pageCopy={copy}
                    onSelect={setSelectedId}
                    onMarkRead={(id) => {
                      void markRead(id);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="laptop:sticky laptop:top-20" aria-label={copy.detailsTitle}>
          <TeacherNotificationDetails
            notification={selectedNotification}
            marking={marking}
            pageCopy={copy}
            onMarkRead={(id) => {
              void markRead(id);
            }}
          />
        </aside>
      </div>
    </div>
  );
}
