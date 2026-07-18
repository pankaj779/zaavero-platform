'use client';

import {
  formatTeacherLessonDate,
  formatTeacherLessonDuration,
  teacherLessonContentTypeLabel,
  teacherLessonsPageCopy,
  type TeacherLessonSummaryDto,
} from '../../../lib/teacher';
import { TeacherDetailList, TeacherDetailsPanel } from '../shared';
import { LessonContentTypeBadge } from './lesson-content-type-badge';

export function LessonDetailsPanel({
  lesson,
  onClose,
}: {
  lesson: TeacherLessonSummaryDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherLessonsPageCopy;

  return (
    <TeacherDetailsPanel
      ariaLabel={`${copy.detailsPanelLabel}: ${lesson.title}`}
      closeLabel={copy.detailsCloseLabel}
      title={lesson.title}
      eyebrow={<LessonContentTypeBadge contentType={lesson.contentType} />}
      onClose={onClose}
      focusKey={lesson.id}
      contentClassName="grid gap-6 p-5 pt-0 tablet:grid-cols-2"
    >
      <section className="space-y-3" aria-label={copy.lessonInfoLabel}>
        <h3 className="text-small font-semibold text-foreground">{copy.lessonInfoLabel}</h3>
        <TeacherDetailList
          layout="inline"
          rows={[
            { id: 'title', label: 'Title', value: lesson.title },
            { id: 'course', label: copy.courseLabel, value: lesson.course.title },
            { id: 'module', label: copy.moduleLabel, value: lesson.module.name },
            {
              id: 'type',
              label: copy.contentTypeLabel,
              value: teacherLessonContentTypeLabel[lesson.contentType],
            },
            {
              id: 'duration',
              label: copy.durationLabel,
              value: formatTeacherLessonDuration(lesson.durationSeconds),
            },
            { id: 'order', label: copy.orderLabel, value: String(lesson.displayOrder) },
            {
              id: 'updated',
              label: copy.lastUpdatedLabel,
              value: formatTeacherLessonDate(lesson.updatedAt),
            },
          ]}
        />
      </section>

      <section className="space-y-3" aria-label="Lesson rollups">
        <h3 className="text-small font-semibold text-foreground">Rollups</h3>
        <TeacherDetailList
          layout="inline"
          rows={[
            {
              id: 'attachments',
              label: copy.attachmentsLabel,
              value: String(lesson.attachmentCount),
            },
            {
              id: 'completions',
              label: copy.completionsLabel,
              value: String(lesson.completionCount),
            },
            {
              id: 'description',
              label: 'Description',
              value: lesson.description.length > 0 ? lesson.description : '—',
            },
          ]}
        />
      </section>
    </TeacherDetailsPanel>
  );
}
