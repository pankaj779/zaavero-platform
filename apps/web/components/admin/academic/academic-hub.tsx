import { Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import Link from 'next/link';
import { ADMIN_ROUTES, icons } from '../../../lib/constants';
import { AdminCapabilityNotice, AdminPageHeader } from '../shared';

const resources = [
  {
    label: 'Courses',
    description: 'Catalog, publishing, and ownership',
    href: ADMIN_ROUTES.courses,
    icon: 'book',
  },
  {
    label: 'Batches',
    description: 'Cohorts, dates, capacity, and teachers',
    href: ADMIN_ROUTES.batches,
    icon: 'layers',
  },
  {
    label: 'Lessons',
    description: 'Content, ordering, and modules',
    href: ADMIN_ROUTES.lessons,
    icon: 'fileText',
  },
  {
    label: 'Assignments',
    description: 'Deadlines, status, and grading setup',
    href: ADMIN_ROUTES.assignments,
    icon: 'clipboard',
  },
  {
    label: 'Attendance',
    description: 'Session attendance and learner records',
    href: ADMIN_ROUTES.attendance,
    icon: 'check',
  },
  {
    label: 'Live Classes',
    description: 'Schedules, providers, and session status',
    href: ADMIN_ROUTES.liveClasses,
    icon: 'video',
  },
  {
    label: 'Certificates',
    description: 'Eligibility, issuance, and revocation',
    href: ADMIN_ROUTES.certificates,
    icon: 'award',
  },
] as const;

export function AcademicHub(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Academic Management"
        description="Manage the complete academic lifecycle using organization-scoped APIs."
      />
      <section
        className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
        aria-label="Academic resources"
      >
        {resources.map((resource) => {
          const Icon = icons[resource.icon];
          return (
            <Link
              key={resource.href}
              href={resource.href}
              className="group focus-visible:outline-none"
            >
              <Card className="h-full rounded-xl transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardHeader className="flex flex-row items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <CardTitle className="text-base">{resource.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-small text-muted-foreground">{resource.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
      <AdminCapabilityNotice
        title="Course modules"
        description="Module records exist in Prisma, but the current NestJS application does not expose module endpoints. Lesson management remains available for existing modules."
      />
    </div>
  );
}
