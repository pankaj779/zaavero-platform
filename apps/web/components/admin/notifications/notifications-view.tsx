'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@graphology/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminApi, NotificationApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import type { TeacherNotificationDto } from '../../../lib/teacher';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { AdminPageHeader } from '../shared';

type StatusFilter = 'all' | 'unread' | 'read';
type AudienceFilter = 'all' | 'Admin' | 'Teacher' | 'Student';

const SEARCH_DEBOUNCE_MS = 300;

interface AdminNotificationRow extends TeacherNotificationDto {
  audience: AudienceFilter | 'Unknown';
}

export function AdminNotificationsView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [items, setItems] = useState<AdminNotificationRow[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [audience, setAudience] = useState<AudienceFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const load = useCallback(async () => {
    if (!primaryOrganizationId) {
      setError(true);
      setLoading(false);
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(false);
    try {
      const [notifications, users] = await Promise.all([
        NotificationApi.getNotifications({
          organizationId: primaryOrganizationId,
          channel: 'IN_APP',
          unreadOnly: status === 'unread' ? true : undefined,
          page: 1,
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        AdminApi.getUsers({
          organizationId: primaryOrganizationId,
          page: 1,
          limit: 100,
        }),
      ]);
      if (requestId !== requestIdRef.current) {
        return;
      }

      const roleByUserId = new Map<string, AudienceFilter | 'Unknown'>();
      for (const user of users.items) {
        if (user.roles.some((role) => role.name === 'Admin')) {
          roleByUserId.set(user.id, 'Admin');
        } else if (user.roles.some((role) => role.name === 'Teacher')) {
          roleByUserId.set(user.id, 'Teacher');
        } else if (user.roles.some((role) => role.name === 'Student')) {
          roleByUserId.set(user.id, 'Student');
        } else {
          roleByUserId.set(user.id, 'Unknown');
        }
      }

      const rows: AdminNotificationRow[] = notifications.items.map((item) => ({
        ...item,
        audience: roleByUserId.get(item.userId) ?? 'Unknown',
      }));

      setItems(rows);
      setSelectedId((current) => current ?? rows[0]?.id ?? null);
    } catch {
      if (requestId === requestIdRef.current) {
        setError(true);
        setItems([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [primaryOrganizationId, status]);

  useEffect(() => {
    void load();
  }, [load, version]);

  const visible = useMemo(() => {
    return items.filter((item) => {
      if (status === 'read' && item.readAt === null) {
        return false;
      }
      if (status === 'unread' && item.readAt !== null) {
        return false;
      }
      if (audience !== 'all' && item.audience !== audience) {
        return false;
      }
      const needle = debouncedQuery.trim().toLowerCase();
      if (!needle) {
        return true;
      }
      return (
        item.title.toLowerCase().includes(needle) ||
        item.message.toLowerCase().includes(needle) ||
        item.type.toLowerCase().includes(needle)
      );
    });
  }, [audience, debouncedQuery, items, status]);

  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? null;

  async function markRead(id: string): Promise<void> {
    setSaving(true);
    try {
      await NotificationApi.markNotificationRead(id);
      setVersion((current) => current + 1);
    } finally {
      setSaving(false);
    }
  }

  async function markAllRead(): Promise<void> {
    if (!primaryOrganizationId) {
      return;
    }
    setSaving(true);
    try {
      await NotificationApi.markAllNotificationsRead(primaryOrganizationId);
      setVersion((current) => current + 1);
    } finally {
      setSaving(false);
    }
  }

  if (loading && items.length === 0 && !error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Notifications"
          description="Review organization notifications and read state."
        />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading notifications…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Notifications"
          description="Review organization notifications and read state."
        />
        <TeacherModuleErrorState
          title="Unable to load notifications"
          description="Retry to reload organization notifications."
          onRetry={() => {
            setVersion((current) => current + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Notifications"
        description="Review organization notifications and read state."
        actions={
          <Button size="sm" variant="outline" disabled={saving} onClick={() => void markAllRead()}>
            Mark my notifications read
          </Button>
        }
      />

      <section className="grid gap-3 tablet:grid-cols-3" aria-label="Notification filters">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="Search notifications"
          aria-label="Search notifications"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as StatusFilter);
          }}
        >
          <SelectTrigger aria-label="Filter by read status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={audience}
          onValueChange={(value) => {
            setAudience(value as AudienceFilter);
          }}
        >
          <SelectTrigger aria-label="Filter by audience">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All audiences</SelectItem>
            <SelectItem value="Admin">System / Admin</SelectItem>
            <SelectItem value="Teacher">Teachers</SelectItem>
            <SelectItem value="Student">Students</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {visible.length === 0 ? (
        <TeacherModuleEmptyState
          title="No notifications found"
          description="Adjust filters or wait for new organization notifications."
        />
      ) : (
        <div className="grid gap-6 laptop:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Inbox ({visible.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {visible.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        item.id === selected?.id ? 'bg-muted/70' : ''
                      }`}
                      onClick={() => {
                        setSelectedId(item.id);
                      }}
                    >
                      <span>
                        <span className="block text-sm font-medium">{item.title}</span>
                        <span className="block text-caption text-muted-foreground">
                          {item.message || 'No message body'}
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <Badge variant={item.readAt ? 'neutral' : 'secondary'}>
                          {item.readAt ? 'Read' : 'Unread'}
                        </Badge>
                        <span className="text-caption text-muted-foreground">{item.audience}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">{selected?.title ?? 'Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selected ? (
                <>
                  <p className="text-small text-muted-foreground">
                    {selected.message || 'No message body'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="neutral">{selected.type}</Badge>
                    <Badge variant="neutral">{selected.audience}</Badge>
                    <Badge variant={selected.readAt ? 'neutral' : 'secondary'}>
                      {selected.readAt ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                  <p className="text-caption text-muted-foreground">
                    Created {new Date(selected.createdAt).toLocaleString()}
                  </p>
                  {!selected.readAt ? (
                    <Button size="sm" disabled={saving} onClick={() => void markRead(selected.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </>
              ) : (
                <p className="text-small text-muted-foreground">Select a notification.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
