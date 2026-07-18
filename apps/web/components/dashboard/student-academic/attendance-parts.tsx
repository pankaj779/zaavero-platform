'use client';

import { useId } from 'react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@graphology/ui';
import { cn } from '@graphology/utils';
import type { StudentAttendanceRecordDto } from '../../../lib/student';
import { formatTeacherLiveClassDateTime } from '../../../lib/teacher';
import { teacherCardSurfaceClass } from '../../teacher/shared';
import { DashboardSearch, DashboardStatGrid, DashboardStatusSortFilters } from '../shared';
import { studentAttendancePageCopy, studentAttendanceStatusLabel } from './copy';
import type { StudentAttendanceSortOption, StudentAttendanceStatusFilter } from './filters';
import { StudentModuleEmptyState } from './shared';

const statusOptions: { value: StudentAttendanceStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
];

const sortOptions: { value: StudentAttendanceSortOption; label: string }[] = [
  { value: 'session_date', label: 'Session date' },
  { value: 'recently_marked', label: 'Recently marked' },
  { value: 'status', label: 'Status' },
];

const statusVariant: Record<
  StudentAttendanceRecordDto['status'],
  'success' | 'danger' | 'warning' | 'secondary'
> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  excused: 'secondary',
};

export function StudentAttendanceStats({
  presentCount,
  absentCount,
  lateCount,
  excusedCount,
  attendancePercent,
}: {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercent: number | null;
}): React.JSX.Element {
  const copy = studentAttendancePageCopy;
  return (
    <DashboardStatGrid
      ariaLabel="Attendance statistics"
      stats={[
        {
          id: 'rate',
          label: copy.rateLabel,
          value:
            attendancePercent === null ? copy.rateUnavailable : `${String(attendancePercent)}%`,
          helper: 'Present + late over present + late + absent (excused excluded).',
        },
        {
          id: 'present',
          label: 'Present',
          value: String(presentCount),
          helper: 'Marked present.',
        },
        {
          id: 'late',
          label: 'Late',
          value: String(lateCount),
          helper: 'Marked late.',
        },
        {
          id: 'absent-excused',
          label: 'Absent / excused',
          value: `${String(absentCount)} / ${String(excusedCount)}`,
          helper: 'Absent and excused marks.',
        },
      ]}
    />
  );
}

export function StudentAttendanceFilters({
  query,
  status,
  sort,
  courseId,
  batchId,
  liveSessionId,
  courseOptions,
  batchOptions,
  sessionOptions,
  onQueryChange,
  onStatusChange,
  onSortChange,
  onCourseChange,
  onBatchChange,
  onSessionChange,
}: {
  query: string;
  status: StudentAttendanceStatusFilter;
  sort: StudentAttendanceSortOption;
  courseId: string;
  batchId: string;
  liveSessionId: string;
  courseOptions: readonly { value: string; label: string }[];
  batchOptions: readonly { value: string; label: string }[];
  sessionOptions: readonly { value: string; label: string }[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: StudentAttendanceStatusFilter) => void;
  onSortChange: (value: StudentAttendanceSortOption) => void;
  onCourseChange: (value: string) => void;
  onBatchChange: (value: string) => void;
  onSessionChange: (value: string) => void;
}): React.JSX.Element {
  const copy = studentAttendancePageCopy;
  const statusSelectId = useId();
  const sortSelectId = useId();
  const courseSelectId = useId();
  const batchSelectId = useId();
  const sessionSelectId = useId();

  return (
    <section className="space-y-4" aria-label="Attendance filters">
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
        <div className="w-full tablet:max-w-[14rem]">
          <label className="sr-only" htmlFor={sessionSelectId}>
            {copy.sessionFilterLabel}
          </label>
          <Select value={liveSessionId} onValueChange={onSessionChange}>
            <SelectTrigger id={sessionSelectId} aria-label={copy.sessionFilterLabel}>
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              {sessionOptions.map((option) => (
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

export function StudentAttendanceCard({
  record,
}: {
  record: StudentAttendanceRecordDto;
}): React.JSX.Element {
  return (
    <Card className={cn('flex h-full flex-col', teacherCardSurfaceClass)}>
      <CardHeader className="space-y-2 p-5 pb-0">
        <Badge variant={statusVariant[record.status]}>
          {studentAttendanceStatusLabel[record.status]}
        </Badge>
        <CardTitle className="text-base leading-snug">{record.session.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <dl className="grid gap-2 text-small">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Course</dt>
            <dd className="text-right font-medium">{record.session.course.title}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Batch</dt>
            <dd className="text-right font-medium">{record.session.batch.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Session</dt>
            <dd className="text-right font-medium">
              {formatTeacherLiveClassDateTime(record.session.startsAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Marked</dt>
            <dd className="text-right font-medium">
              {formatTeacherLiveClassDateTime(record.markedAt)}
            </dd>
          </div>
        </dl>
        {record.notes ? <p className="text-caption text-muted-foreground">{record.notes}</p> : null}
      </CardContent>
    </Card>
  );
}

export function StudentAttendanceCollection({
  records,
}: {
  records: StudentAttendanceRecordDto[];
}): React.JSX.Element {
  const copy = studentAttendancePageCopy;
  if (records.length === 0) {
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
      {records.map((record) => (
        <li key={record.id}>
          <StudentAttendanceCard record={record} />
        </li>
      ))}
    </ul>
  );
}
