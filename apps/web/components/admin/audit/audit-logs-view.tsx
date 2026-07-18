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
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminAuditLogDto } from '../../../lib/admin';
import { AdminApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { AdminPageHeader } from '../shared';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

export function AdminAuditLogsView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [action, setAction] = useState('all');
  const [entity, setEntity] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminAuditLogDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, action, entity, sortOrder]);

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
      const result = await AdminApi.getAuditLogs({
        organizationId: primaryOrganizationId,
        search: debouncedQuery || undefined,
        action: action === 'all' ? undefined : action,
        entity: entity === 'all' ? undefined : entity,
        page,
        limit: PAGE_SIZE,
        sortOrder,
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setItems(result.items);
      setTotal(result.meta.total);
      setTotalPages(Math.max(1, result.meta.totalPages));
      setSelectedId((current) => current ?? result.items[0]?.id ?? null);
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
  }, [action, debouncedQuery, entity, page, primaryOrganizationId, sortOrder]);

  useEffect(() => {
    void load();
  }, [load, version]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const actionOptions = Array.from(new Set(items.map((item) => item.action))).sort();
  const entityOptions = Array.from(new Set(items.map((item) => item.entity))).sort();

  if (loading && items.length === 0 && !error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Audit Logs"
          description="Search administrative and security-relevant activity."
        />
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading audit logs…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Audit Logs"
          description="Search administrative and security-relevant activity."
        />
        <TeacherModuleErrorState
          title="Unable to load audit logs"
          description="Retry to reload organization audit activity."
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
        title="Audit Logs"
        description="Search administrative and security-relevant activity."
      />

      <section
        className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-4"
        aria-label="Audit filters"
      >
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="Search action, entity, or actor"
          aria-label="Search audit logs"
        />
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value);
          }}
        >
          <SelectTrigger aria-label="Filter by action">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actionOptions.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={entity}
          onValueChange={(value) => {
            setEntity(value);
          }}
        >
          <SelectTrigger aria-label="Filter by entity">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entityOptions.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortOrder}
          onValueChange={(value) => {
            setSortOrder(value as 'asc' | 'desc');
          }}
        >
          <SelectTrigger aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest first</SelectItem>
            <SelectItem value="asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {items.length === 0 ? (
        <TeacherModuleEmptyState
          title="No audit logs found"
          description="Administrative mutations will appear here as they are recorded."
        />
      ) : (
        <div className="grid gap-6 laptop:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Events ({total})</CardTitle>
              <p className="text-caption text-muted-foreground">
                Page {page} of {totalPages}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="divide-y divide-border rounded-lg border border-border">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        item.id === selectedId ? 'bg-muted/70' : ''
                      }`}
                      onClick={() => {
                        setSelectedId(item.id);
                      }}
                    >
                      <span>
                        <span className="block text-sm font-medium">{item.action}</span>
                        <span className="block text-caption text-muted-foreground">
                          {item.entity}
                          {item.user
                            ? ` · ${item.user.firstName} ${item.user.lastName}`
                            : ' · System'}
                        </span>
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1));
                  }}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((current) => current + 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-base">Event details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selected ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{selected.action}</Badge>
                    <Badge variant="neutral">{selected.entity}</Badge>
                  </div>
                  <Detail label="When" value={new Date(selected.createdAt).toLocaleString()} />
                  <Detail
                    label="Actor"
                    value={
                      selected.user
                        ? `${selected.user.firstName} ${selected.user.lastName} (${selected.user.email})`
                        : 'System / unattributed'
                    }
                  />
                  <Detail label="Entity id" value={selected.entityId ?? '—'} />
                  <Detail label="IP address" value={selected.ipAddress ?? '—'} />
                  <Detail label="User agent" value={selected.userAgent ?? '—'} />
                  <div className="space-y-1">
                    <p className="text-caption text-muted-foreground">Metadata</p>
                    <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 text-caption">
                      {JSON.stringify(selected.metadata ?? {}, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <p className="text-small text-muted-foreground">Select an audit event.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="text-small">{value}</p>
    </div>
  );
}
