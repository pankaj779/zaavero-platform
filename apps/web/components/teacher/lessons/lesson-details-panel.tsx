'use client';

import { FileUpload } from '@graphology/ui';
import { useState } from 'react';
import { LessonApi, StorageApi } from '../../../lib/api';
import {
  formatTeacherLessonDate,
  formatTeacherLessonDuration,
  teacherLessonContentTypeLabel,
  teacherLessonsPageCopy,
  type TeacherLessonSummaryDto,
} from '../../../lib/teacher';
import { TeacherDetailList, TeacherDetailsPanel } from '../shared';
import { LessonContentTypeBadge } from './lesson-content-type-badge';

function lessonEntityType(
  contentType: TeacherLessonSummaryDto['contentType'],
): 'LESSON_VIDEO' | 'LESSON_PDF' | null {
  switch (contentType) {
    case 'video':
      return 'LESSON_VIDEO';
    case 'pdf':
      return 'LESSON_PDF';
    default:
      return null;
  }
}

function lessonAccept(contentType: TeacherLessonSummaryDto['contentType']): string | undefined {
  switch (contentType) {
    case 'video':
      return 'video/mp4,video/webm';
    case 'pdf':
      return 'application/pdf';
    default:
      return undefined;
  }
}

export function LessonDetailsPanel({
  lesson,
  organizationId,
  onClose,
  onLessonUpdated,
}: {
  lesson: TeacherLessonSummaryDto;
  organizationId: string;
  onClose: () => void;
  onLessonUpdated?: (lesson: TeacherLessonSummaryDto) => void;
}): React.JSX.Element {
  const copy = teacherLessonsPageCopy;
  const entityType = lessonEntityType(lesson.contentType);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentUrl, setContentUrl] = useState(lesson.contentUrl);

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
            {
              id: 'content',
              label: 'Content URL',
              value: contentUrl ?? '—',
            },
          ]}
        />
        {entityType ? (
          <FileUpload
            accept={lessonAccept(lesson.contentType)}
            disabled={uploading || !organizationId}
            label={uploading ? 'Uploading content…' : 'Upload lesson content'}
            helperText={lesson.contentType === 'video' ? 'MP4 or WebM' : 'PDF document'}
            onFilesChange={(files) => {
              const file = files?.[0];
              if (!file) {
                return;
              }
              setUploading(true);
              setError(null);
              void StorageApi.upload(file, {
                organizationId,
                entityType,
                entityId: lesson.id,
              })
                .then((asset) =>
                  LessonApi.updateLesson(lesson.id, {
                    contentUrl: asset.id,
                    contentType: lesson.contentType.toUpperCase(),
                  }),
                )
                .then((updated) => {
                  setContentUrl(updated.contentUrl);
                  onLessonUpdated?.(updated);
                })
                .catch(() => {
                  setError('Unable to upload lesson content.');
                })
                .finally(() => {
                  setUploading(false);
                });
            }}
          />
        ) : null}
        {error ? (
          <p className="text-caption text-destructive" role="alert">
            {error}
          </p>
        ) : null}
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
