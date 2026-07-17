import {
  getTeacherAnalyticsCourseById,
  teacherAnalyticsPageCopy,
  type TeacherAnalyticsCourseRefDto,
  type TeacherAnalyticsSectionDto,
} from '../../../lib/teacher';
import { AnalyticsChartPlaceholder } from './analytics-chart-placeholder';

export function AnalyticsSectionCollection({
  sections,
  courses,
  selectedMetricId,
  onSelect,
}: {
  sections: TeacherAnalyticsSectionDto[];
  courses: TeacherAnalyticsCourseRefDto[];
  selectedMetricId?: string | null;
  onSelect?: (metricId: string) => void;
}): React.JSX.Element {
  return (
    <ul
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={teacherAnalyticsPageCopy.sectionsLabel}
    >
      {sections.map((section) => {
        const course = getTeacherAnalyticsCourseById(courses, section.courseId);

        return (
          <li key={section.id} className="h-full">
            <AnalyticsChartPlaceholder
              section={section}
              courseTitle={course?.title ?? null}
              selected={section.metricId === selectedMetricId}
              onSelect={onSelect}
            />
          </li>
        );
      })}
    </ul>
  );
}
