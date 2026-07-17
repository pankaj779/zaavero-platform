import { Card } from '@graphology/ui';
import { courseDetailsCopy, type CourseDetailsDto } from '../../../lib/dashboard';
import { CourseThumbnail } from '../learning/course-thumbnail';

export function CourseOverview({ course }: { course: CourseDetailsDto }): React.JSX.Element {
  return (
    <div className="space-y-8">
      <CourseThumbnail label={course.media.imageAlt || courseDetailsCopy.imageLabel} />

      <section className="space-y-3" aria-labelledby="course-description-heading">
        <h3 id="course-description-heading" className="text-h4 text-foreground">
          Course Description
        </h3>
        <p className="text-body text-muted-foreground">{course.description}</p>
      </section>

      <section className="space-y-3" aria-labelledby="objectives-heading">
        <h3 id="objectives-heading" className="text-h4 text-foreground">
          {courseDetailsCopy.objectivesTitle}
        </h3>
        <ul className="list-disc space-y-2 pl-5 text-small text-muted-foreground">
          {course.learningObjectives.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="skills-heading">
        <h3 id="skills-heading" className="text-h4 text-foreground">
          {courseDetailsCopy.skillsTitle}
        </h3>
        <ul className="flex flex-wrap gap-2">
          {course.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-border bg-surface px-3 py-1 text-caption text-foreground"
            >
              {skill}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="prerequisites-heading">
        <h3 id="prerequisites-heading" className="text-h4 text-foreground">
          {courseDetailsCopy.prerequisitesTitle}
        </h3>
        <ul className="list-disc space-y-2 pl-5 text-small text-muted-foreground">
          {course.prerequisites.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <Card className="grid gap-4 rounded-xl p-5 shadow-sm tablet:grid-cols-3">
        <div>
          <p className="text-caption text-muted-foreground">{courseDetailsCopy.durationLabel}</p>
          <p className="mt-1 text-sm font-medium text-foreground">{course.meta.duration}</p>
        </div>
        <div>
          <p className="text-caption text-muted-foreground">{courseDetailsCopy.languageLabel}</p>
          <p className="mt-1 text-sm font-medium text-foreground">{course.meta.language}</p>
        </div>
        <div>
          <p className="text-caption text-muted-foreground">{courseDetailsCopy.certificateLabel}</p>
          <p className="mt-1 text-sm font-medium text-foreground">{course.meta.certificate.label}</p>
        </div>
      </Card>
    </div>
  );
}
