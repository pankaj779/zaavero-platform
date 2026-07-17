import {
  teacherRecentActivityPlaceholder,
  teacherTodaysClassesPlaceholder,
  teacherUpcomingWorkPlaceholder,
} from '../../../lib/teacher';
import { TeacherSectionCard } from '../shared';
import { TeacherGreeting } from './teacher-greeting';
import { TeacherStatGrid } from './teacher-stat-grid';

export function TeacherDashboardView(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <TeacherGreeting />

      <TeacherStatGrid />

      <div className="grid gap-4 laptop:grid-cols-2">
        <TeacherSectionCard
          title={teacherTodaysClassesPlaceholder.title}
          description={teacherTodaysClassesPlaceholder.description}
          items={teacherTodaysClassesPlaceholder.items}
        />
        <TeacherSectionCard
          title={teacherUpcomingWorkPlaceholder.title}
          description={teacherUpcomingWorkPlaceholder.description}
          items={teacherUpcomingWorkPlaceholder.items}
        />
        <TeacherSectionCard
          className="laptop:col-span-2"
          title={teacherRecentActivityPlaceholder.title}
          description={teacherRecentActivityPlaceholder.description}
          items={teacherRecentActivityPlaceholder.items}
        />
      </div>
    </div>
  );
}
