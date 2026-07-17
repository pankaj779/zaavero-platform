'use client';

import { Button, Card, EmptyState } from '@graphology/ui';
import Link from 'next/link';
import { useState } from 'react';
import { DASHBOARD_ROUTES, icons } from '../../../lib/constants';
import {
  courseDetailsCopy,
  courseDetailsViewState,
  type CourseDetailsDto,
  type CourseDetailsViewState,
  type CourseTabId,
} from '../../../lib/dashboard';
import { ErrorState } from '../error-state';
import { AnnouncementTimeline } from './announcement-timeline';
import { CourseDetailsSkeleton } from './course-details-skeleton';
import { CourseHero } from './course-hero';
import { CourseOverview } from './course-overview';
import { CourseSidebar } from './course-sidebar';
import { CourseTabs } from './course-tabs';
import { CurriculumAccordion } from './curriculum-accordion';
import { ResourcesList } from './resources-list';

const BookIcon = icons.book;

function CourseNotFoundState(): React.JSX.Element {
  return (
    <Card className="rounded-xl p-2 shadow-sm">
      <EmptyState
        className="border-0 bg-transparent"
        title={courseDetailsCopy.emptyTitle}
        description={courseDetailsCopy.emptyDescription}
        illustration={<BookIcon className="h-7 w-7" aria-hidden />}
      />
      <div className="flex justify-center pb-8">
        <Button variant="primary" size="md" asChild>
          <Link href={DASHBOARD_ROUTES.learning}>{courseDetailsCopy.breadcrumbLearning}</Link>
        </Button>
      </div>
    </Card>
  );
}

export function CourseDetailsView({
  course,
  viewState = courseDetailsViewState,
}: {
  course: CourseDetailsDto | null;
  viewState?: CourseDetailsViewState;
}): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CourseTabId>('overview');

  if (viewState === 'loading') {
    return <CourseDetailsSkeleton />;
  }

  if (viewState === 'error') {
    return (
      <ErrorState
        title={courseDetailsCopy.errorTitle}
        description={courseDetailsCopy.errorDescription}
      />
    );
  }

  if (viewState === 'empty' || !course) {
    return <CourseNotFoundState />;
  }

  return (
    <div className="space-y-8">
      <CourseHero course={course} />

      <div className="grid gap-6 laptop:grid-cols-[minmax(0,1fr)_18rem] laptop:items-start">
        <div className="min-w-0">
          <CourseTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            panels={{
              overview: <CourseOverview course={course} />,
              curriculum: (
                <CurriculumAccordion modules={course.modules} courseSlug={course.slug} />
              ),
              resources: <ResourcesList resources={course.resources} />,
              announcements: <AnnouncementTimeline announcements={course.announcements} />,
            }}
          />
        </div>

        <div className="order-last laptop:order-none">
          <CourseSidebar course={course} />
        </div>
      </div>
    </div>
  );
}
