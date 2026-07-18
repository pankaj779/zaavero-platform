'use client';

import { Button, Card, CardContent, PageHeader, Skeleton } from '@graphology/ui';
import { DashboardEmptyState } from '../shared';
import { ErrorState } from '../error-state';
import { icons } from '../../../lib/constants';

const AlertIcon = icons.alert;
const BookIcon = icons.book;

export function StudentModuleHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.JSX.Element {
  return <PageHeader title={title} description={description} />;
}

export function StudentModuleSkeleton({ label }: { label: string }): React.JSX.Element {
  return (
    <div className="space-y-8" aria-busy="true" aria-label={label}>
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`stat-${String(index)}`} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 tablet:grid-cols-2 laptop:grid-cols-4">
        <Skeleton className="h-10 w-full tablet:col-span-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`card-${String(index)}`} className="rounded-xl shadow-sm">
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StudentModuleErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}): React.JSX.Element {
  return (
    <div className="space-y-4">
      <ErrorState title={title} description={description} />
      {onRetry ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex justify-center" aria-hidden>
          <AlertIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export function StudentModuleEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.JSX.Element {
  return (
    <DashboardEmptyState
      title={title}
      description={description}
      illustration={<BookIcon className="h-7 w-7" aria-hidden />}
    />
  );
}

export function StudentPaginationBar({
  page,
  totalPages,
  total,
  label,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  label: string;
  onPageChange: (page: number) => void;
}): React.JSX.Element | null {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between"
      aria-label={label}
    >
      <p className="text-caption text-muted-foreground">
        {`Page ${String(page)} of ${String(totalPages)} · ${String(total)} total`}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1);
          }}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => {
            onPageChange(page + 1);
          }}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
