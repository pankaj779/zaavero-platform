'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ProgressBar,
} from '@graphology/ui';
import Link from 'next/link';
import { getCourseDetailsPath, getLessonPath } from '../../../lib/constants';
import type { StudentCourseCardDto } from '../../../lib/student';
import { teacherCardSurfaceClass } from '../../teacher/shared';
import {
  studentCoursesPageCopy,
  studentEnrollmentStatusLabel,
  studentLearningStatusLabel,
} from './copy';
import { enrollmentStatusBadgeVariant, formatStudentLearningDate } from './learning-helpers';

export function StudentCourseCard({ course }: { course: StudentCourseCardDto }): React.JSX.Element {
  const detailsHref = getCourseDetailsPath(course.course.id);
  const resumeId = course.progress.resumeLessonId;
  const continueHref = resumeId ? getLessonPath(course.course.id, resumeId) : detailsHref;

  return (
    <Card className={`flex h-full flex-col ${teacherCardSurfaceClass}`}>
      <CardHeader className="space-y-3 p-5 pb-0">
        <div className="flex flex-wrap gap-2">
          <Badge variant={enrollmentStatusBadgeVariant(course.enrollmentStatus)}>
            {studentEnrollmentStatusLabel[course.enrollmentStatus]}
          </Badge>
          <Badge variant="neutral">{studentLearningStatusLabel[course.learningStatus]}</Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-base leading-snug">{course.course.title}</CardTitle>
          {course.description ? (
            <CardDescription className="line-clamp-2 leading-relaxed">
              {course.description}
            </CardDescription>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <p className="text-small text-muted-foreground">
          <span className="font-medium text-foreground">{studentCoursesPageCopy.batchLabel}: </span>
          {course.batch.name}
        </p>

        <div className="space-y-2">
          <ProgressBar
            value={course.progress.percentage}
            label={studentCoursesPageCopy.progressLabel}
          />
          <p className="text-caption text-muted-foreground">
            {studentCoursesPageCopy.lessonsLabel}: {course.progress.completedLessons}/
            {course.progress.totalLessons}
          </p>
          <p className="text-caption text-muted-foreground">
            {studentCoursesPageCopy.completionLabel}: {course.progress.percentage}%
          </p>
        </div>

        <dl className="grid gap-2 text-caption text-muted-foreground">
          <div className="flex items-start justify-between gap-3">
            <dt>{studentCoursesPageCopy.enrolledLabel}</dt>
            <dd className="text-right text-foreground">
              {formatStudentLearningDate(course.enrolledAt)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt>{studentCoursesPageCopy.lastProgressLabel}</dt>
            <dd className="text-right text-foreground">
              {formatStudentLearningDate(course.lastProgressAt)}
            </dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 p-5 pt-0 tablet:flex-row">
        <Button variant="primary" size="md" className="w-full tablet:flex-1" asChild>
          <Link href={continueHref}>{studentCoursesPageCopy.continueButton}</Link>
        </Button>
        <Button variant="outline" size="md" className="w-full tablet:flex-1" asChild>
          <Link href={detailsHref}>{studentCoursesPageCopy.detailsButton}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
