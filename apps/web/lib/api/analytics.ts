import type {
  TeacherAnalyticsSourceDto,
  TeacherAnalyticsTimeRange,
  TeacherAnalyticsOverviewDto,
} from '../teacher/analytics-types';
import { buildTeacherAnalyticsOverview } from '../teacher/analytics-types';
import { AssignmentApi } from './assignment';
import { AttendanceApi } from './attendance';
import { CertificateApi } from './certificate';
import { CourseApi } from './course';
import { EnrollmentApi } from './enrollment';
import { LiveSessionApi } from './live-session';
import { SubmissionApi } from './submission';

interface AnalyticsParams {
  organizationId: string;
  timeRange?: TeacherAnalyticsTimeRange;
}

interface PageResult<T> {
  items: T[];
  meta: {
    page: number;
    totalPages: number;
  };
}

async function collectPages<T>(fetchPage: (page: number) => Promise<PageResult<T>>): Promise<T[]> {
  const first = await fetchPage(1);
  if (first.meta.totalPages <= 1) {
    return first.items;
  }
  const remaining = await Promise.all(
    Array.from({ length: first.meta.totalPages - 1 }, (_, index) => fetchPage(index + 2)),
  );
  return [...first.items, ...remaining.flatMap((page) => page.items)];
}

/**
 * Aggregates existing organization-scoped APIs for Teacher Analytics.
 * No raw NestJS response or Prisma model crosses this boundary.
 */
export const AnalyticsApi = {
  async getSource(organizationId: string): Promise<TeacherAnalyticsSourceDto> {
    const limit = 100;
    const [
      courses,
      students,
      assignments,
      submissions,
      attendanceSessions,
      liveSessions,
      certificates,
    ] = await Promise.all([
      collectPages((page) =>
        CourseApi.getCourses({
          organizationId,
          page,
          limit,
          sortBy: 'title',
          sortOrder: 'asc',
        }),
      ),
      collectPages((page) =>
        EnrollmentApi.getEnrollments({
          organizationId,
          page,
          limit,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          enrichLookups: false,
        }),
      ),
      collectPages((page) =>
        AssignmentApi.getAssignments({
          organizationId,
          page,
          limit,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          enrichLookups: false,
        }),
      ),
      collectPages((page) =>
        SubmissionApi.getSubmissions({
          organizationId,
          page,
          limit,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          enrichLookups: false,
        }),
      ),
      collectPages((page) =>
        AttendanceApi.getAttendances({
          organizationId,
          page,
          limit,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          enrichLookups: false,
        }),
      ),
      collectPages((page) =>
        LiveSessionApi.getLiveSessions({
          organizationId,
          page,
          limit,
          sortBy: 'startsAt',
          sortOrder: 'desc',
          enrichLookups: false,
        }),
      ),
      collectPages((page) =>
        CertificateApi.getCertificates({
          organizationId,
          page,
          limit,
          sortBy: 'issuedAt',
          sortOrder: 'desc',
          enrichLookups: false,
        }),
      ),
    ]);

    return {
      courses,
      students,
      assignments,
      submissions,
      attendanceSessions,
      liveSessions,
      certificates,
    };
  },

  async getOverview({
    organizationId,
    timeRange = '30d',
  }: AnalyticsParams): Promise<TeacherAnalyticsOverviewDto> {
    const source = await this.getSource(organizationId);
    return buildTeacherAnalyticsOverview(source, timeRange);
  },
};
