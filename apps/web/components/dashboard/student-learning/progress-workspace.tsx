'use client';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  ProgressBar,
  Skeleton,
} from '@graphology/ui';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { StudentApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import { getCourseDetailsPath } from '../../../lib/constants';
import type { StudentCertificateDto, StudentProgressOverviewDto } from '../../../lib/student';
import { TeacherModuleEmptyState, TeacherModuleErrorState } from '../../teacher/shared';
import { studentProgressPageCopy } from './copy';
import {
  deriveProgressMilestones,
  formatStudentLearningDate,
  type StudentCoursesViewState,
  type StudentProgressMilestone,
} from './learning-helpers';

function ProgressSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading progress">
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`progress-stat-${String(index)}`} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function OverallChart({ percentage }: { percentage: number | null }): React.JSX.Element {
  const value = percentage ?? 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        role="img"
        aria-label={
          percentage === null
            ? studentProgressPageCopy.noDataPercent
            : `Overall completion ${String(value)} percent`
        }
      >
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="76" textAnchor="middle" className="fill-foreground text-lg font-semibold">
          {percentage === null ? '—' : `${String(value)}%`}
        </text>
      </svg>
      <p className="text-sm font-medium text-foreground">{studentProgressPageCopy.overallLabel}</p>
    </div>
  );
}

function MilestoneList({
  milestones,
}: {
  milestones: StudentProgressMilestone[];
}): React.JSX.Element {
  return (
    <ul className="space-y-3 p-0">
      {milestones.map((milestone) => (
        <li
          key={milestone.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{milestone.title}</p>
            <p className="text-caption text-muted-foreground">{milestone.description}</p>
          </div>
          <Badge variant={milestone.unlocked ? 'success' : 'neutral'}>
            {milestone.unlocked ? studentProgressPageCopy.unlocked : studentProgressPageCopy.locked}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function ProgressWorkspace({
  initialOverview,
  initialCertificates,
  initialViewState,
}: {
  initialOverview?: StudentProgressOverviewDto | null;
  initialCertificates?: StudentCertificateDto[];
  initialViewState?: StudentCoursesViewState;
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [viewState, setViewState] = useState<StudentCoursesViewState>(
    initialViewState ?? 'loading',
  );
  const [overview, setOverview] = useState<StudentProgressOverviewDto | null>(
    initialOverview ?? null,
  );
  const [certificates, setCertificates] = useState<StudentCertificateDto[]>(
    initialCertificates ?? [],
  );
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!primaryOrganizationId) {
      setOverview(null);
      setCertificates([]);
      setViewState('empty');
      return;
    }

    const [progress, certs] = await Promise.all([
      StudentApi.getProgress(primaryOrganizationId),
      StudentApi.getCertificates({
        organizationId: primaryOrganizationId,
        page: 1,
        limit: 50,
        status: 'ISSUED',
        sortBy: 'issuedAt',
        sortOrder: 'desc',
      }),
    ]);

    setOverview(progress);
    setCertificates(certs.items.filter((item) => item.status === 'issued'));

    if (progress.totalLessons === 0 && certs.items.length === 0) {
      setViewState('empty');
    } else {
      setViewState('populated');
    }
  }, [primaryOrganizationId]);

  useEffect(() => {
    if (initialViewState !== undefined) {
      return;
    }

    const controller = new AbortController();
    setViewState('loading');
    void (async () => {
      try {
        await load();
      } catch {
        if (!controller.signal.aborted) {
          setViewState('error');
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [initialViewState, load, reloadKey]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <PageHeader
          title={studentProgressPageCopy.title}
          description={studentProgressPageCopy.description}
        />
        <ProgressSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <PageHeader
          title={studentProgressPageCopy.title}
          description={studentProgressPageCopy.description}
        />
        <TeacherModuleErrorState
          title={studentProgressPageCopy.errorTitle}
          description={studentProgressPageCopy.errorDescription}
          retryLabel={studentProgressPageCopy.retryLabel}
          onRetry={() => {
            setReloadKey((current) => current + 1);
          }}
        />
      </div>
    );
  }

  if (viewState === 'empty' || !overview) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={studentProgressPageCopy.title}
          description={studentProgressPageCopy.description}
        />
        <TeacherModuleEmptyState
          title={studentProgressPageCopy.emptyTitle}
          description={studentProgressPageCopy.emptyDescription}
          icon="trending"
        />
      </div>
    );
  }

  const milestones = deriveProgressMilestones(overview);

  return (
    <div className="space-y-8">
      <PageHeader
        title={studentProgressPageCopy.title}
        description={studentProgressPageCopy.description}
      />

      <section
        className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-4"
        aria-label="Progress summary"
      >
        <Card className="rounded-xl shadow-sm">
          <CardContent className="flex justify-center p-5">
            <OverallChart percentage={overview.percentage} />
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {studentProgressPageCopy.completedLessonsLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{overview.completedLessons}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {studentProgressPageCopy.remainingLessonsLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{overview.remainingLessons}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{studentProgressPageCopy.totalLessonsLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{overview.totalLessons}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4" aria-label={studentProgressPageCopy.coursesLabel}>
        <h2 className="text-lg font-semibold text-foreground">
          {studentProgressPageCopy.coursesLabel}
        </h2>
        {overview.courses.length === 0 ? (
          <p className="text-small text-muted-foreground">
            {studentProgressPageCopy.emptyDescription}
          </p>
        ) : (
          <ul className="grid gap-4 p-0 laptop:grid-cols-2">
            {overview.courses.map((course) => (
              <li key={course.courseId}>
                <Card className="rounded-xl shadow-sm">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base">
                      <Link
                        href={getCourseDetailsPath(course.courseId)}
                        className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {course.courseTitle}
                      </Link>
                    </CardTitle>
                    <ProgressBar
                      value={course.percentage}
                      label={`${course.courseTitle} progress`}
                    />
                  </CardHeader>
                  <CardContent className="text-caption text-muted-foreground">
                    {course.completedLessons}/{course.totalLessons} completed ·{' '}
                    {course.remainingLessons} remaining
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-label={studentProgressPageCopy.milestonesLabel}>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {studentProgressPageCopy.milestonesLabel}
          </h2>
          <p className="text-caption text-muted-foreground">
            {studentProgressPageCopy.milestonesHint}
          </p>
        </div>
        <MilestoneList milestones={milestones} />
      </section>

      <section className="space-y-3" aria-label={studentProgressPageCopy.certificatesLabel}>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {studentProgressPageCopy.certificatesLabel}
          </h2>
          <p className="text-caption text-muted-foreground">
            {studentProgressPageCopy.certificatesHint} · {overview.certificatesUnlocked} unlocked
            count from progress rollup
          </p>
        </div>
        {certificates.length === 0 ? (
          <p className="text-small text-muted-foreground">
            {studentProgressPageCopy.certificatesEmpty}
          </p>
        ) : (
          <ul className="space-y-3 p-0">
            {certificates.map((certificate) => (
              <li key={certificate.id}>
                <Card className="rounded-xl shadow-sm">
                  <CardContent className="flex flex-col gap-2 p-4 tablet:flex-row tablet:items-center tablet:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {certificate.course.title}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {certificate.certificateNumber ?? 'No certificate number'} ·{' '}
                        {formatStudentLearningDate(certificate.issuedAt)}
                      </p>
                    </div>
                    <Badge variant="success">{certificate.status}</Badge>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
