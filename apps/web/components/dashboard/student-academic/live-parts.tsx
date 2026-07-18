'use client';

import { useId } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@graphology/ui';
import { cn } from '@graphology/utils';
import type { StudentLiveClassDto } from '../../../lib/student';
import {
  formatTeacherLiveClassDateTime,
  teacherLiveClassStatusLabel,
  teacherMeetingStatusLabel,
} from '../../../lib/teacher';
import {
  TeacherDetailList,
  TeacherDetailsPanel,
  teacherCardSurfaceClass,
} from '../../teacher/shared';
import { DashboardSearch, DashboardStatGrid, DashboardStatusSortFilters } from '../shared';
import { buildGoogleCalendarUrl, canJoinLiveClass, canPlayRecording } from './capabilities';
import { studentAttendanceStatusLabel, studentLivePageCopy } from './copy';
import type {
  StudentLiveScheduleFilter,
  StudentLiveSortOption,
  StudentLiveStatusFilter,
} from './filters';
import { StudentModuleEmptyState } from './shared';

const scheduleOptions: { value: StudentLiveScheduleFilter; label: string }[] = [
  { value: 'all', label: 'All schedules' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

const statusOptions: { value: StudentLiveStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const sortOptions: { value: StudentLiveSortOption; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming first' },
  { value: 'recently_updated', label: 'Recently updated' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

const statusVariant: Record<
  StudentLiveClassDto['status'],
  'warning' | 'primary' | 'success' | 'neutral'
> = {
  scheduled: 'warning',
  live: 'primary',
  completed: 'success',
  cancelled: 'neutral',
};

export function StudentLiveStats({
  stats,
}: {
  stats: { id: string; label: string; value: string; helper: string }[];
}): React.JSX.Element {
  return <DashboardStatGrid stats={stats} ariaLabel="Live class statistics" />;
}

export function StudentLiveFilters({
  query,
  status,
  schedule,
  sort,
  courseId,
  batchId,
  courseOptions,
  batchOptions,
  onQueryChange,
  onStatusChange,
  onScheduleChange,
  onSortChange,
  onCourseChange,
  onBatchChange,
}: {
  query: string;
  status: StudentLiveStatusFilter;
  schedule: StudentLiveScheduleFilter;
  sort: StudentLiveSortOption;
  courseId: string;
  batchId: string;
  courseOptions: readonly { value: string; label: string }[];
  batchOptions: readonly { value: string; label: string }[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: StudentLiveStatusFilter) => void;
  onScheduleChange: (value: StudentLiveScheduleFilter) => void;
  onSortChange: (value: StudentLiveSortOption) => void;
  onCourseChange: (value: string) => void;
  onBatchChange: (value: string) => void;
}): React.JSX.Element {
  const copy = studentLivePageCopy;
  const statusSelectId = useId();
  const sortSelectId = useId();
  const scheduleSelectId = useId();
  const courseSelectId = useId();
  const batchSelectId = useId();

  return (
    <section className="space-y-4" aria-label="Live class filters">
      <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center laptop:flex-wrap">
        <div className="w-full laptop:max-w-sm">
          <DashboardSearch
            value={query}
            onChange={onQueryChange}
            placeholder={copy.searchPlaceholder}
            ariaLabel={copy.searchLabel}
          />
        </div>
        <div className="w-full tablet:max-w-[14rem]">
          <label className="sr-only" htmlFor={scheduleSelectId}>
            {copy.scheduleFilterLabel}
          </label>
          <Select
            value={schedule}
            onValueChange={(value) => {
              onScheduleChange(value as StudentLiveScheduleFilter);
            }}
          >
            <SelectTrigger id={scheduleSelectId} aria-label={copy.scheduleFilterLabel}>
              <SelectValue placeholder="Schedule" />
            </SelectTrigger>
            <SelectContent>
              {scheduleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

function LiveClassActions({
  session,
  onSelect,
  showDetails = true,
}: {
  session: StudentLiveClassDto;
  onSelect?: (id: string) => void;
  showDetails?: boolean;
}): React.JSX.Element {
  const copy = studentLivePageCopy;
  const joinEnabled = canJoinLiveClass(session);
  const recordingEnabled = canPlayRecording(session);
  const meetingUrl = session.meeting.meetingUrl;
  const recordingUrl = session.recordingUrl;
  const calendarUrl = buildGoogleCalendarUrl(session);

  return (
    <div className="flex w-full flex-col gap-2">
      {showDetails && onSelect ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label={`${copy.detailsButton} — ${session.title}`}
          onClick={() => {
            onSelect(session.id);
          }}
        >
          {copy.detailsButton}
        </Button>
      ) : null}
      <div className="grid gap-2 tablet:grid-cols-3">
        {joinEnabled && meetingUrl ? (
          <Button type="button" size="sm" asChild>
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
              {copy.joinButton}
            </a>
          </Button>
        ) : (
          <Button type="button" size="sm" disabled aria-label={`${copy.joinButton} unavailable`}>
            {copy.joinButton}
          </Button>
        )}
        {recordingEnabled && recordingUrl ? (
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={recordingUrl} target="_blank" rel="noopener noreferrer">
              {copy.recordingButton}
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            aria-label={copy.recordingUnavailable}
          >
            {copy.recordingButton}
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
            {copy.calendarButton}
          </a>
        </Button>
      </div>
    </div>
  );
}

export function StudentLiveCard({
  session,
  selected,
  onSelect,
}: {
  session: StudentLiveClassDto;
  selected: boolean;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  const copy = studentLivePageCopy;
  const attendance =
    session.attendanceStatus === null
      ? copy.notMarkedLabel
      : studentAttendanceStatusLabel[session.attendanceStatus];

  return (
    <Card
      className={cn(
        'flex h-full flex-col',
        teacherCardSurfaceClass,
        selected ? 'ring-2 ring-primary ring-offset-2' : '',
      )}
    >
      <CardHeader className="space-y-2 p-5 pb-0">
        <Badge variant={statusVariant[session.status]}>
          {teacherLiveClassStatusLabel[session.status]}
        </Badge>
        <CardTitle className="text-base leading-snug">{session.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <dl className="grid gap-2 text-small">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Course</dt>
            <dd className="text-right font-medium">{session.course.title}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Batch</dt>
            <dd className="text-right font-medium">{session.batch.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Starts</dt>
            <dd className="text-right font-medium">
              {formatTeacherLiveClassDateTime(session.startsAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Meeting</dt>
            <dd className="text-right font-medium">
              {teacherMeetingStatusLabel[session.meeting.status]}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{copy.attendanceLabel}</dt>
            <dd className="text-right font-medium">{attendance}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <LiveClassActions session={session} onSelect={onSelect} />
      </CardFooter>
    </Card>
  );
}

export function StudentLiveDetails({
  session,
  onClose,
}: {
  session: StudentLiveClassDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = studentLivePageCopy;
  const joinEnabled = canJoinLiveClass(session);
  const recordingEnabled = canPlayRecording(session);

  return (
    <TeacherDetailsPanel
      ariaLabel={`Live class details: ${session.title}`}
      closeLabel={copy.detailsCloseLabel}
      title={session.title}
      eyebrow={
        <Badge variant={statusVariant[session.status]}>
          {teacherLiveClassStatusLabel[session.status]}
        </Badge>
      }
      onClose={onClose}
      focusKey={session.id}
      contentClassName="grid gap-6 p-5 pt-0 tablet:grid-cols-2"
    >
      <TeacherDetailList
        layout="stack"
        rows={[
          { id: 'course', label: 'Course', value: session.course.title },
          { id: 'batch', label: 'Batch', value: session.batch.name },
          {
            id: 'starts',
            label: 'Starts',
            value: formatTeacherLiveClassDateTime(session.startsAt),
          },
          {
            id: 'ends',
            label: 'Ends',
            value: formatTeacherLiveClassDateTime(session.endsAt),
          },
          {
            id: 'duration',
            label: 'Duration',
            value: `${String(session.durationMinutes)} min`,
          },
          {
            id: 'provider',
            label: 'Provider',
            value: session.meeting.provider,
          },
          {
            id: 'meeting-status',
            label: 'Meeting status',
            value: teacherMeetingStatusLabel[session.meeting.status],
          },
          {
            id: 'attendance',
            label: copy.attendanceLabel,
            value:
              session.attendanceStatus === null
                ? copy.notMarkedLabel
                : studentAttendanceStatusLabel[session.attendanceStatus],
          },
          {
            id: 'url',
            label: 'Meeting URL',
            value: joinEnabled
              ? (session.meeting.meetingUrl ?? copy.meetingUrlPending)
              : copy.meetingUrlPending,
          },
          {
            id: 'recording',
            label: 'Recording',
            value: recordingEnabled
              ? (session.recordingUrl ?? copy.recordingUnavailable)
              : copy.recordingUnavailable,
          },
        ]}
      />
      <LiveClassActions session={session} showDetails={false} />
    </TeacherDetailsPanel>
  );
}

export function StudentLiveCollection({
  sessions,
  selectedId,
  onSelect,
}: {
  sessions: StudentLiveClassDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  const copy = studentLivePageCopy;
  if (sessions.length === 0) {
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
      {sessions.map((session) => (
        <li key={session.id}>
          <StudentLiveCard
            session={session}
            selected={selectedId === session.id}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
