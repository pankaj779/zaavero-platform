'use client';

import { useEffect, useId, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  FileUpload,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@graphology/ui';
import { cn } from '@graphology/utils';
import { StorageApi } from '../../../lib/api';
import type { StudentAssignmentDto } from '../../../lib/student';
import {
  formatTeacherAssignmentDate,
  teacherAssignmentStatusLabel,
  teacherSubmissionStatusLabel,
} from '../../../lib/teacher';
import {
  TeacherDetailList,
  TeacherDetailsPanel,
  teacherCardSurfaceClass,
} from '../../teacher/shared';
import { DashboardSearch, DashboardStatGrid, DashboardStatusSortFilters } from '../shared';
import { canEditOwnSubmission } from './capabilities';
import { studentAssignmentsPageCopy } from './copy';
import type { StudentAssignmentSortOption, StudentAssignmentStatusFilter } from './filters';
import { StudentModuleEmptyState } from './shared';

const statusOptions: { value: StudentAssignmentStatusFilter; label: string }[] = [
  { value: 'all', label: 'Published & closed' },
  { value: 'published', label: 'Published' },
  { value: 'closed', label: 'Closed' },
];

const sortOptions: { value: StudentAssignmentSortOption; label: string }[] = [
  { value: 'due_soon', label: 'Due soon' },
  { value: 'recently_updated', label: 'Recently updated' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

const assignmentVariant: Record<
  StudentAssignmentDto['status'],
  'warning' | 'success' | 'neutral' | 'secondary'
> = {
  draft: 'neutral',
  published: 'success',
  closed: 'secondary',
  archived: 'neutral',
};

export function StudentAssignmentStats({
  stats,
}: {
  stats: { id: string; label: string; value: string; helper: string }[];
}): React.JSX.Element {
  return <DashboardStatGrid stats={stats} ariaLabel="Assignment statistics" />;
}

export function StudentAssignmentFilters({
  query,
  status,
  sort,
  courseId,
  batchId,
  courseOptions,
  batchOptions,
  onQueryChange,
  onStatusChange,
  onSortChange,
  onCourseChange,
  onBatchChange,
}: {
  query: string;
  status: StudentAssignmentStatusFilter;
  sort: StudentAssignmentSortOption;
  courseId: string;
  batchId: string;
  courseOptions: readonly { value: string; label: string }[];
  batchOptions: readonly { value: string; label: string }[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: StudentAssignmentStatusFilter) => void;
  onSortChange: (value: StudentAssignmentSortOption) => void;
  onCourseChange: (value: string) => void;
  onBatchChange: (value: string) => void;
}): React.JSX.Element {
  const copy = studentAssignmentsPageCopy;
  const statusSelectId = useId();
  const sortSelectId = useId();
  const courseSelectId = useId();
  const batchSelectId = useId();

  return (
    <section className="space-y-4" aria-label="Assignment filters">
      <div className="flex flex-col gap-3 laptop:flex-row laptop:flex-wrap laptop:items-center">
        <div className="w-full laptop:max-w-sm">
          <DashboardSearch
            value={query}
            onChange={onQueryChange}
            placeholder={copy.searchPlaceholder}
            ariaLabel={copy.searchLabel}
          />
        </div>
        <div className="w-full tablet:max-w-[14rem]">
          <label className="sr-only" htmlFor={courseSelectId}>
            {copy.courseFilterLabel}
          </label>
          <Select value={courseId} onValueChange={onCourseChange}>
            <SelectTrigger id={courseSelectId} aria-label={copy.courseFilterLabel}>
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              {courseOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full tablet:max-w-[14rem]">
          <label className="sr-only" htmlFor={batchSelectId}>
            {copy.batchFilterLabel}
          </label>
          <Select value={batchId} onValueChange={onBatchChange}>
            <SelectTrigger id={batchSelectId} aria-label={copy.batchFilterLabel}>
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              {batchOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DashboardStatusSortFilters
          status={status}
          sort={sort}
          statusOptions={statusOptions}
          sortOptions={sortOptions}
          statusFilterLabel={copy.statusFilterLabel}
          sortLabel={copy.sortLabel}
          statusSelectId={statusSelectId}
          sortSelectId={sortSelectId}
          onStatusChange={onStatusChange}
          onSortChange={onSortChange}
        />
      </div>
    </section>
  );
}

export function StudentAssignmentCard({
  assignment,
  selected,
  onSelect,
}: {
  assignment: StudentAssignmentDto;
  selected: boolean;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  const copy = studentAssignmentsPageCopy;
  const submissionLabel = assignment.submission
    ? teacherSubmissionStatusLabel[assignment.submission.status]
    : copy.noSubmissionLabel;

  return (
    <Card
      className={cn(
        'flex h-full flex-col',
        teacherCardSurfaceClass,
        selected ? 'ring-2 ring-primary ring-offset-2' : '',
      )}
    >
      <CardHeader className="space-y-2 p-5 pb-0">
        <Badge variant={assignmentVariant[assignment.status]}>
          {teacherAssignmentStatusLabel[assignment.status]}
        </Badge>
        <CardTitle className="text-base leading-snug">{assignment.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <dl className="grid gap-2 text-small">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Course</dt>
            <dd className="text-right font-medium">{assignment.course.title}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Due</dt>
            <dd className="text-right font-medium">
              {formatTeacherAssignmentDate(assignment.dueAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Max score</dt>
            <dd className="text-right font-medium">
              {assignment.maxScore === null ? '—' : String(assignment.maxScore)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Submission</dt>
            <dd className="text-right font-medium">{submissionLabel}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => {
            onSelect(assignment.id);
          }}
        >
          {copy.detailsButton}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function StudentAssignmentDetails({
  assignment,
  organizationId,
  onClose,
  onSubmit,
}: {
  assignment: StudentAssignmentDto;
  organizationId: string;
  onClose: () => void;
  onSubmit: (
    assignment: StudentAssignmentDto,
    content: string,
    attachments: string[],
  ) => Promise<void>;
}): React.JSX.Element {
  const copy = studentAssignmentsPageCopy;
  const contentId = useId();
  const editable = canEditOwnSubmission(assignment);
  const [content, setContent] = useState(assignment.submission?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    setContent(assignment.submission?.content ?? '');
    setSaved(false);
    setError(null);
    setLastAttempt(null);
  }, [assignment.id, assignment.submission?.content, assignment.submission?.updatedAt]);

  async function save(nextContent: string): Promise<void> {
    setSaving(true);
    setError(null);
    setSaved(false);
    setLastAttempt(nextContent);
    try {
      const assets = await Promise.all(
        files.map((file) =>
          StorageApi.upload(file, {
            organizationId,
            entityType: 'SUBMISSION_ATTACHMENT',
            entityId: assignment.submission?.id ?? assignment.id,
          }),
        ),
      );
      await onSubmit(
        assignment,
        nextContent,
        assets.map((asset) => asset.id),
      );
      setSaved(true);
      setFiles([]);
    } catch {
      setError('Could not save your submission. You can retry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <TeacherDetailsPanel
      ariaLabel={`Assignment details: ${assignment.title}`}
      closeLabel={copy.detailsCloseLabel}
      title={assignment.title}
      eyebrow={
        <Badge variant={assignmentVariant[assignment.status]}>
          {teacherAssignmentStatusLabel[assignment.status]}
        </Badge>
      }
      onClose={onClose}
      focusKey={assignment.id}
      contentClassName="grid gap-6 p-5 pt-0 tablet:grid-cols-2"
    >
      <div className="space-y-4">
        <TeacherDetailList
          layout="stack"
          rows={[
            { id: 'course', label: 'Course', value: assignment.course.title },
            {
              id: 'batch',
              label: 'Batch',
              value: assignment.batch?.name ?? '—',
            },
            {
              id: 'due',
              label: 'Due',
              value: formatTeacherAssignmentDate(assignment.dueAt),
            },
            {
              id: 'max',
              label: 'Max score',
              value: assignment.maxScore === null ? '—' : String(assignment.maxScore),
            },
            {
              id: 'submission-status',
              label: 'Submission status',
              value: assignment.submission
                ? teacherSubmissionStatusLabel[assignment.submission.status]
                : copy.noSubmissionLabel,
            },
            {
              id: 'grade',
              label: copy.gradeLabel,
              value:
                assignment.submission?.score === null || assignment.submission?.score === undefined
                  ? '—'
                  : String(assignment.submission.score),
            },
            {
              id: 'feedback',
              label: copy.feedbackLabel,
              value: assignment.submission?.feedback?.trim() ?? '—',
            },
          ]}
        />
        <section className="space-y-2" aria-label={copy.instructionsLabel}>
          <h3 className="text-small font-semibold">{copy.instructionsLabel}</h3>
          <p className="whitespace-pre-wrap text-small text-muted-foreground">
            {assignment.instructions?.trim() ?? 'No instructions provided.'}
          </p>
        </section>
        <FileUpload
          multiple
          disabled={!editable || saving}
          label="Attach files"
          helperText={files.length ? `${String(files.length)} file(s) selected` : undefined}
          onFilesChange={(selected) => {
            setFiles(Array.from(selected ?? []));
          }}
        />
      </div>

      <section className="space-y-3" aria-label={copy.contentLabel}>
        <Label htmlFor={contentId}>{copy.contentLabel}</Label>
        <Textarea
          id={contentId}
          rows={10}
          value={content}
          disabled={!editable || saving}
          onChange={(event) => {
            setContent(event.target.value);
            setSaved(false);
          }}
        />
        {editable ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={saving || content.trim().length === 0}
              onClick={() => {
                void save(content);
              }}
            >
              {saving
                ? copy.savingLabel
                : assignment.submission
                  ? copy.updateButton
                  : copy.submitButton}
            </Button>
            {error && lastAttempt !== null ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => {
                  void save(lastAttempt);
                }}
              >
                {copy.retryLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
        {saved ? <p className="text-caption text-success">{copy.savedLabel}</p> : null}
        {error ? (
          <p className="text-caption text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </TeacherDetailsPanel>
  );
}

export function StudentAssignmentCollection({
  assignments,
  selectedId,
  onSelect,
}: {
  assignments: StudentAssignmentDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  const copy = studentAssignmentsPageCopy;
  if (assignments.length === 0) {
    return (
      <StudentModuleEmptyState
        title={copy.noMatchesTitle}
        description={copy.noMatchesDescription}
      />
    );
  }

  return (
    <ul
      className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3"
      aria-label={copy.collectionLabel}
    >
      {assignments.map((assignment) => (
        <li key={assignment.id}>
          <StudentAssignmentCard
            assignment={assignment}
            selected={selectedId === assignment.id}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
