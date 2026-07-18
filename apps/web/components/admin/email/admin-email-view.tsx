'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@graphology/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EmailApi,
  type EmailLogDto,
  type EmailPageMeta,
  type EmailProviderStatusDto,
  type EmailQueueDto,
  type EmailStatsDto,
  type EmailTemplateDto,
  type EmailTemplatePreviewDto,
} from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { InvitationManagementCard } from '../../shared/invitation-management-card';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { AdminPageHeader } from '../shared';

type TabId = 'dashboard' | 'logs' | 'queue' | 'failed' | 'templates' | 'invitations';
const PAGE_SIZE = 20;
const emptyMeta: EmailPageMeta = { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 };

export function AdminEmailView(): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [tab, setTab] = useState<TabId>('dashboard');
  const [provider, setProvider] = useState<EmailProviderStatusDto | null>(null);
  const [stats, setStats] = useState<EmailStatsDto | null>(null);
  const [logs, setLogs] = useState<EmailLogDto[]>([]);
  const [queue, setQueue] = useState<EmailQueueDto[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateDto[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
    }, 300);
    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [query, status, tab]);

  const load = useCallback(async () => {
    if (!primaryOrganizationId) {
      setLoading(false);
      setError(true);
      return;
    }
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(false);
    setNotice(null);
    try {
      if (tab === 'dashboard') {
        const [nextProvider, nextStats] = await Promise.all([
          EmailApi.getProvider(),
          EmailApi.getStats(primaryOrganizationId),
        ]);
        if (requestId !== requestRef.current) return;
        setProvider(nextProvider);
        setStats(nextStats);
      } else if (tab === 'logs') {
        const result = await EmailApi.getLogs({
          organizationId: primaryOrganizationId,
          search: query || undefined,
          status: status === 'all' ? undefined : status,
          page,
          limit: PAGE_SIZE,
        });
        if (requestId !== requestRef.current) return;
        setLogs(result.items);
        setMeta(result.meta);
      } else if (tab === 'queue' || tab === 'failed') {
        const params = {
          organizationId: primaryOrganizationId,
          search: query || undefined,
          status: status === 'all' ? undefined : status,
          page,
          limit: PAGE_SIZE,
        };
        const result =
          tab === 'failed' ? await EmailApi.getFailed(params) : await EmailApi.getQueue(params);
        if (requestId !== requestRef.current) return;
        setQueue(result.items);
        setMeta(result.meta);
      } else if (tab === 'invitations') {
        if (requestId !== requestRef.current) return;
      } else {
        const result = await EmailApi.getTemplates(primaryOrganizationId);
        if (requestId !== requestRef.current) return;
        setTemplates(
          query
            ? result.filter((item) =>
                `${item.key} ${item.subject} ${item.category}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
            : result,
        );
      }
    } catch {
      if (requestId === requestRef.current) setError(true);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [page, primaryOrganizationId, query, status, tab]);

  useEffect(() => void load(), [load, version]);

  async function mutateQueue(id: string, action: 'retry' | 'cancel'): Promise<void> {
    if (!primaryOrganizationId) return;
    setActionId(id);
    setNotice(null);
    try {
      const updated =
        action === 'retry'
          ? await EmailApi.retryQueued(id, primaryOrganizationId)
          : await EmailApi.cancelQueued(id, primaryOrganizationId, 'Cancelled by administrator');
      setNotice(
        updated
          ? `Email ${action === 'retry' ? 'queued for retry' : 'cancelled'}.`
          : 'Email state was unchanged.',
      );
      if (updated) setVersion((value) => value + 1);
    } catch {
      setNotice(`Unable to ${action} this email.`);
    } finally {
      setActionId(null);
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'logs', label: 'Logs' },
    { id: 'queue', label: 'Queue' },
    { id: 'failed', label: 'Failed' },
    { id: 'templates', label: 'Templates' },
    { id: 'invitations', label: 'Invitations' },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Email"
        description="Monitor delivery, manage queued messages, and preview tenant templates."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setVersion((value) => value + 1);
            }}
          >
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Email workspace sections">
        {tabs.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={tab === item.id ? 'default' : 'outline'}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => {
              setTab(item.id);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab !== 'dashboard' && tab !== 'invitations' ? (
        <div className="flex flex-col gap-3 tablet:flex-row">
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Search email records"
            aria-label="Search email records"
          />
          {tab !== 'templates' ? (
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="tablet:w-52" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(tab === 'logs'
                  ? ['SENT', 'DELIVERED', 'OPENED', 'BOUNCED', 'FAILED']
                  : ['QUEUED', 'PROCESSING', 'FAILED', 'DEAD_LETTER', 'CANCELLED']
                ).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      ) : null}

      {notice ? (
        <p className="text-small text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}

      {tab === 'invitations' ? (
        primaryOrganizationId ? (
          <InvitationManagementCard
            organizationId={primaryOrganizationId}
            allowedTypes={['TEACHER', 'STUDENT', 'ORGANIZATION']}
            title="Organization invitations"
            description="Invite teachers, students, or organization members. Session-created invitations can be resent or revoked here."
          />
        ) : (
          <Empty label="Select an organization to manage invitations." />
        )
      ) : loading ? (
        <p className="py-16 text-center text-small text-muted-foreground" role="status">
          Loading email workspace…
        </p>
      ) : error ? (
        <TeacherModuleErrorState
          title="Unable to load email data"
          description="Check your email permissions and retry."
          onRetry={() => {
            setVersion((value) => value + 1);
          }}
        />
      ) : tab === 'dashboard' && provider && stats ? (
        <EmailDashboard provider={provider} stats={stats} />
      ) : tab === 'logs' ? (
        logs.length ? (
          <LogsTable items={logs} />
        ) : (
          <Empty label="No delivery logs match these filters." />
        )
      ) : tab === 'queue' || tab === 'failed' ? (
        queue.length ? (
          <QueueTable
            items={queue}
            actionId={actionId}
            failed={tab === 'failed'}
            onAction={mutateQueue}
          />
        ) : (
          <Empty label={tab === 'failed' ? 'No failed emails.' : 'The email queue is empty.'} />
        )
      ) : templates.length ? (
        <TemplateWorkspace organizationId={primaryOrganizationId ?? ''} templates={templates} />
      ) : (
        <Empty label="No active email templates." />
      )}

      {tab !== 'dashboard' && tab !== 'templates' && tab !== 'invitations' && !loading && !error ? (
        <Pagination meta={meta} onPage={setPage} />
      ) : null}
    </div>
  );
}

function EmailDashboard({
  provider,
  stats,
}: {
  provider: EmailProviderStatusDto;
  stats: EmailStatsDto;
}): React.JSX.Element {
  const metrics = [
    ['Total', stats.total],
    ['Sent', stats.sent],
    ['Delivered', stats.delivered],
    ['Opened', stats.opened],
    ['Bounced', stats.bounced],
    ['Complaints', stats.complained],
    ['Failed', stats.failed],
  ] as const;
  return (
    <div className="space-y-4">
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Provider status</CardTitle>
              <CardDescription>{provider.provider} delivery adapter</CardDescription>
            </div>
            <Badge variant={provider.configured ? 'secondary' : 'neutral'}>
              {provider.configured ? 'Configured' : 'Not configured'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 tablet:grid-cols-2">
          <StatusRow label="Delivery mode" value={provider.sandbox ? 'Sandbox' : 'Live'} />
          <StatusRow
            label="Webhook verification"
            value={provider.webhookVerificationConfigured ? 'Configured' : 'Not configured'}
          />
        </CardContent>
      </Card>
      <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label} className="rounded-xl">
            <CardContent className="pt-6">
              <p className="text-caption text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function LogsTable({ items }: { items: EmailLogDto[] }): React.JSX.Element {
  return (
    <Card className="overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-caption text-muted-foreground">
            <tr>
              <th className="p-3">Recipient</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="p-3">{item.to.length ? item.to.join(', ') : '—'}</td>
                <td className="max-w-xs truncate p-3">
                  {item.subject ? item.subject : (item.templateKey ?? '—')}
                </td>
                <td className="p-3">{item.category}</td>
                <td className="p-3">
                  <Badge variant="neutral">{item.status}</Badge>
                </td>
                <td className="whitespace-nowrap p-3">{formatDate(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function QueueTable({
  items,
  actionId,
  failed,
  onAction,
}: {
  items: EmailQueueDto[];
  actionId: string | null;
  failed: boolean;
  onAction: (id: string, action: 'retry' | 'cancel') => Promise<void>;
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="rounded-xl">
          <CardContent className="flex flex-col gap-4 pt-6 tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium">
                  {item.renderedSubject ?? item.templateKey ?? 'Untitled email'}
                </p>
                <Badge variant="neutral">{item.status}</Badge>
              </div>
              <p className="mt-1 text-caption text-muted-foreground">
                {item.to.length ? item.to.join(', ') : 'No recipient'} · {item.attempts}/
                {item.maxAttempts} attempts · {formatDate(item.createdAt)}
              </p>
              {item.lastErrorMessage ? (
                <p className="mt-1 text-caption text-destructive">{item.lastErrorMessage}</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              {failed || item.status === 'DEAD_LETTER' ? (
                <Button
                  size="sm"
                  disabled={actionId !== null}
                  onClick={() => void onAction(item.id, 'retry')}
                >
                  {actionId === item.id ? 'Working…' : 'Retry'}
                </Button>
              ) : null}
              {item.status === 'QUEUED' || item.status === 'PROCESSING' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionId !== null}
                  onClick={() => void onAction(item.id, 'cancel')}
                >
                  {actionId === item.id ? 'Working…' : 'Cancel'}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TemplateWorkspace({
  organizationId,
  templates,
}: {
  organizationId: string;
  templates: EmailTemplateDto[];
}): React.JSX.Element {
  const [selected, setSelected] = useState(templates[0]?.key ?? '');
  const [variables, setVariables] = useState('{}');
  const [preview, setPreview] = useState<EmailTemplatePreviewDto | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function renderPreview(): Promise<void> {
    setPreviewing(true);
    setError(null);
    try {
      const parsed = JSON.parse(variables) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Variables must be an object');
      }
      const template = templates.find((item) => item.key === selected);
      setPreview(
        await EmailApi.previewTemplate({
          organizationId,
          key: selected,
          locale: template?.locale ?? 'en',
          variables: parsed as Record<string, unknown>,
        }),
      );
    } catch {
      setError('Preview failed. Enter valid JSON and all variables required by the template.');
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <div className="grid gap-4 desktop:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Template preview</CardTitle>
          <CardDescription>Render a safe preview with test variables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-template">Template</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger id="email-template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((item) => (
                  <SelectItem key={item.id} value={item.key}>
                    {item.key} · {item.locale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-template-variables">Variables (JSON)</Label>
            <Textarea
              id="email-template-variables"
              rows={8}
              value={variables}
              onChange={(event) => {
                setVariables(event.target.value);
              }}
            />
          </div>
          <Button disabled={!selected || previewing} onClick={() => void renderPreview()}>
            {previewing ? 'Rendering…' : 'Preview'}
          </Button>
          {error ? (
            <p className="text-small text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">{preview?.subject ?? 'Rendered email'}</CardTitle>
          <CardDescription>
            {preview?.preview ?? 'Choose a template and render it to inspect the output.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {preview ? (
            <iframe
              title="Email template preview"
              sandbox=""
              srcDoc={preview.html}
              className="min-h-96 w-full rounded-lg border border-border bg-white"
            />
          ) : (
            <p className="py-16 text-center text-small text-muted-foreground">
              No preview rendered.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Pagination({
  meta,
  onPage,
}: {
  meta: EmailPageMeta;
  onPage: (page: number) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-caption text-muted-foreground">
        {meta.total} records · Page {meta.page} of {Math.max(meta.totalPages, 1)}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={meta.page <= 1}
          onClick={() => {
            onPage(meta.page - 1);
          }}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={meta.page >= meta.totalPages}
          onClick={() => {
            onPage(meta.page + 1);
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }): React.JSX.Element {
  return (
    <TeacherModuleEmptyState
      title={label}
      description="Adjust the filters or refresh this workspace."
    />
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}
