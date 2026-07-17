'use client';

import { Button, Card, EmptyState } from '@graphology/ui';
import Link from 'next/link';
import { DASHBOARD_ROUTES, icons } from '../../../lib/constants';
import {
  lessonPlayerCopy,
  lessonPlayerViewState,
  type LessonPlayerDto,
  type LessonPlayerViewState,
} from '../../../lib/dashboard';
import { LessonErrorState } from './lesson-error-state';
import { LessonHeader } from './lesson-header';
import { LessonNavigation } from './lesson-navigation';
import { LessonNotes } from './lesson-notes';
import { LessonProgress } from './lesson-progress';
import { LessonRenderer } from './lesson-renderer';
import { LessonResources } from './lesson-resources';
import { LessonSidebar } from './lesson-sidebar';
import { LessonSidebarDrawer } from './lesson-sidebar-drawer';
import { LessonSkeleton } from './lesson-skeleton';

const BookIcon = icons.book;

function LessonEmptyState(): React.JSX.Element {
  return (
    <Card className="rounded-xl p-2 shadow-sm">
      <EmptyState
        className="border-0 bg-transparent"
        title={lessonPlayerCopy.emptyTitle}
        description={lessonPlayerCopy.emptyDescription}
        illustration={<BookIcon className="h-7 w-7" aria-hidden />}
      />
      <div className="flex justify-center pb-8">
        <Button variant="primary" size="md" asChild>
          <Link href={DASHBOARD_ROUTES.learning}>{lessonPlayerCopy.breadcrumbLearning}</Link>
        </Button>
      </div>
    </Card>
  );
}

export function LessonPlayer({
  data,
  viewState = lessonPlayerViewState,
}: {
  data: LessonPlayerDto | null;
  viewState?: LessonPlayerViewState;
}): React.JSX.Element {
  if (viewState === 'loading') {
    return <LessonSkeleton />;
  }

  if (viewState === 'error') {
    return <LessonErrorState />;
  }

  if (viewState === 'empty' || !data) {
    return <LessonEmptyState />;
  }

  return (
    <div className="space-y-6">
      <LessonHeader data={data} />

      <LessonSidebarDrawer data={data} />

      <div className="grid gap-6 laptop:grid-cols-[minmax(0,70%)_minmax(16rem,30%)] laptop:items-start">
        <div className="min-w-0 space-y-6">
          <LessonRenderer lesson={data.lesson} />
          <LessonProgress data={data} />
          <LessonNotes notes={data.lesson.notes} />
          <LessonResources resources={data.lesson.resources} />
          <LessonNavigation data={data} />
        </div>

        <div className="hidden laptop:block">
          <div className="laptop:sticky laptop:top-20">
            <LessonSidebar data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
