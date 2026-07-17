import { formatDashboardDate, formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Calendar DTOs — shaped like a future GET /teachers/me/calendar response.
 * Aggregates live classes, assignment due dates, office hours, holidays, and
 * reminders as opaque schedule items. Meeting URLs and locations stay null until
 * calendar / provider integrations land. Graphology is one sample course only.
 */

export type TeacherCalendarEventType =
  | 'live_class'
  | 'assignment_due'
  | 'office_hours'
  | 'holiday'
  | 'reminder';

export type TeacherCalendarEventStatus = 'scheduled' | 'completed' | 'cancelled' | 'tentative';
export type TeacherCalendarViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherCalendarEventFilter =
  | 'all'
  | 'live_classes'
  | 'assignments'
  | 'office_hours'
  | 'reminders'
  | 'holidays';

export type TeacherIntegrationAvailability = 'coming_soon';

export interface TeacherCalendarCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface TeacherCalendarBatchRefDto {
  id: string;
  name: string;
}

export interface TeacherCalendarMentorDto {
  id: string;
  name: string;
}

export interface TeacherCalendarFutureFeaturesDto {
  googleCalendar: TeacherIntegrationAvailability;
  outlook: TeacherIntegrationAvailability;
  meetingProvisioning: TeacherIntegrationAvailability;
  reminders: TeacherIntegrationAvailability;
}

export interface TeacherCalendarEventDto {
  id: string;
  title: string;
  type: TeacherCalendarEventType;
  course: TeacherCalendarCourseRefDto | null;
  batch: TeacherCalendarBatchRefDto | null;
  mentor: TeacherCalendarMentorDto;
  startTime: string;
  endTime: string;
  timezone: string;
  meetingProvider: string | null;
  /** Always null until meeting providers are integrated. */
  meetingUrl: null;
  /** Always null until venue / room booking is integrated. */
  location: null;
  status: TeacherCalendarEventStatus;
  description: string;
  futureFeatures: TeacherCalendarFutureFeaturesDto;
}

export interface TeacherCalendarDayDto {
  /** ISO date key YYYY-MM-DD (UTC calendar day for mocks). */
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  eventIds: string[];
}

export interface TeacherCalendarMonthDto {
  year: number;
  month: number;
  label: string;
  days: TeacherCalendarDayDto[];
}

export const teacherCalendarViewState: TeacherCalendarViewState = 'populated';

export const teacherCalendarPageCopy = {
  title: 'Calendar',
  description: 'Teaching schedule across live classes, due dates, and office hours.',
  searchPlaceholder: 'Search events, courses, or batches',
  searchLabel: 'Search calendar events',
  filterLabel: 'Filter calendar events',
  legendLabel: 'Event types',
  miniCalendarLabel: 'Mini calendar',
  monthGridLabel: 'Monthly calendar',
  agendaLabel: 'Day agenda',
  detailsLabel: 'Event details',
  detailsCloseLabel: 'Close event details',
  previousMonthLabel: 'Previous month',
  nextMonthLabel: 'Next month',
  todayLabel: 'Today',
  syncButton: 'Sync Calendar',
  createEventButton: 'Create Event',
  addReminderButton: 'Add Reminder',
  connectProviderButton: 'Connect Provider',
  comingSoonNote: 'Calendar integrations coming soon.',
  emptyTitle: 'No calendar events yet',
  emptyDescription:
    'Scheduled teaching events will appear here. Calendar sync arrives in a later sprint.',
  noMatchesTitle: 'No matching events',
  noMatchesDescription: 'Try a different search or event type filter.',
  noDayEventsTitle: 'No events on this day',
  noDayEventsDescription: 'Select another day or clear filters to see more events.',
  noSelectionTitle: 'Select an event',
  noSelectionDescription: 'Choose an agenda item to preview placeholder event details.',
  errorTitle: 'Unable to load calendar',
  errorDescription: 'Something went wrong while loading Calendar. Please try again.',
  courseLabel: 'Course',
  batchLabel: 'Batch',
  mentorLabel: 'Mentor',
  startLabel: 'Starts',
  endLabel: 'Ends',
  timezoneLabel: 'Timezone',
  providerLabel: 'Meeting provider',
  locationLabel: 'Location',
  statusLabel: 'Status',
  typeLabel: 'Type',
  meetingUrlPending: 'Not available yet',
  locationPending: 'Not set',
  futureFeaturesLabel: 'Future integrations',
} as const;

export const teacherCalendarEventTypeLabel: Record<TeacherCalendarEventType, string> = {
  live_class: 'Live Class',
  assignment_due: 'Assignment Due',
  office_hours: 'Office Hours',
  holiday: 'Holiday',
  reminder: 'Reminder',
};

export const teacherCalendarEventStatusLabel: Record<TeacherCalendarEventStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  tentative: 'Tentative',
};

export const teacherCalendarEventFilterOptions: {
  value: TeacherCalendarEventFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'live_classes', label: 'Live Classes' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'office_hours', label: 'Office Hours' },
  { value: 'reminders', label: 'Reminders' },
  { value: 'holidays', label: 'Holidays' },
];

const comingSoonFeatures: TeacherCalendarFutureFeaturesDto = {
  googleCalendar: 'coming_soon',
  outlook: 'coming_soon',
  meetingProvisioning: 'coming_soon',
  reminders: 'coming_soon',
};

const mentor: TeacherCalendarMentorDto = {
  id: 'teacher_placeholder',
  name: 'Teacher Placeholder',
};

/** Initial month shown by the mock calendar workspace. */
export const teacherCalendarInitialMonth = { year: 2026, month: 7 } as const;

/**
 * Sample events for July 2026. Graphology appears once; other programs are generic.
 * meetingUrl and location remain null by contract.
 */
export const teacherCalendarEvents: TeacherCalendarEventDto[] = [
  {
    id: 'tcal_001',
    title: 'Foundations Live Session 5',
    type: 'live_class',
    course: {
      id: 'tcourse_001',
      slug: 'graphology-foundation',
      title: 'Graphology Foundations',
    },
    batch: { id: 'tbatch_001', name: 'Graphology Foundations — Weekend Cohort' },
    mentor,
    startTime: '2026-07-18T11:00:00.000Z',
    endTime: '2026-07-18T12:00:00.000Z',
    timezone: 'UTC',
    meetingProvider: null,
    meetingUrl: null,
    location: null,
    status: 'scheduled',
    description: 'Placeholder live class. Meeting link provisioning is not connected.',
    futureFeatures: comingSoonFeatures,
  },
  {
    id: 'tcal_002',
    title: 'Advanced Program Case Study due',
    type: 'assignment_due',
    course: {
      id: 'tcourse_002',
      slug: 'sample-advanced-program',
      title: 'Sample Advanced Program',
    },
    batch: { id: 'tbatch_002', name: 'Advanced Program — Evening Cohort' },
    mentor,
    startTime: '2026-07-20T18:30:00.000Z',
    endTime: '2026-07-20T18:30:00.000Z',
    timezone: 'UTC',
    meetingProvider: null,
    meetingUrl: null,
    location: null,
    status: 'scheduled',
    description: 'Placeholder assignment due marker. Reminder delivery is not enabled.',
    futureFeatures: comingSoonFeatures,
  },
  {
    id: 'tcal_003',
    title: 'Office hours — evening cohort',
    type: 'office_hours',
    course: {
      id: 'tcourse_002',
      slug: 'sample-advanced-program',
      title: 'Sample Advanced Program',
    },
    batch: { id: 'tbatch_002', name: 'Advanced Program — Evening Cohort' },
    mentor,
    startTime: '2026-07-17T14:00:00.000Z',
    endTime: '2026-07-17T15:00:00.000Z',
    timezone: 'UTC',
    meetingProvider: null,
    meetingUrl: null,
    location: null,
    status: 'scheduled',
    description: 'Placeholder office hours block. Join links remain unavailable.',
    futureFeatures: comingSoonFeatures,
  },
  {
    id: 'tcal_004',
    title: 'Skills Workshop Review',
    type: 'live_class',
    course: {
      id: 'tcourse_003',
      slug: 'sample-skills-workshop',
      title: 'Sample Skills Workshop',
    },
    batch: { id: 'tbatch_003', name: 'Skills Workshop — Morning Group' },
    mentor,
    startTime: '2026-07-15T09:00:00.000Z',
    endTime: '2026-07-15T09:45:00.000Z',
    timezone: 'UTC',
    meetingProvider: null,
    meetingUrl: null,
    location: null,
    status: 'completed',
    description: 'Placeholder completed live class for calendar history.',
    futureFeatures: comingSoonFeatures,
  },
  {
    id: 'tcal_005',
    title: 'Platform maintenance holiday',
    type: 'holiday',
    course: null,
    batch: null,
    mentor,
    startTime: '2026-07-22T00:00:00.000Z',
    endTime: '2026-07-22T23:59:00.000Z',
    timezone: 'UTC',
    meetingProvider: null,
    meetingUrl: null,
    location: null,
    status: 'scheduled',
    description: 'Placeholder holiday / blackout day. Org calendar sync is not connected.',
    futureFeatures: comingSoonFeatures,
  },
  {
    id: 'tcal_006',
    title: 'Prepare grading queue',
    type: 'reminder',
    course: {
      id: 'tcourse_002',
      slug: 'sample-advanced-program',
      title: 'Sample Advanced Program',
    },
    batch: { id: 'tbatch_002', name: 'Advanced Program — Evening Cohort' },
    mentor,
    startTime: '2026-07-21T08:00:00.000Z',
    endTime: '2026-07-21T08:15:00.000Z',
    timezone: 'UTC',
    meetingProvider: null,
    meetingUrl: null,
    location: null,
    status: 'tentative',
    description: 'Placeholder personal reminder. Push/email reminders are not wired.',
    futureFeatures: comingSoonFeatures,
  },
  {
    id: 'tcal_007',
    title: 'Leadership Practice Lab',
    type: 'live_class',
    course: {
      id: 'tcourse_004',
      slug: 'sample-leadership-program',
      title: 'Sample Leadership Program',
    },
    batch: { id: 'tbatch_004', name: 'Leadership Program — Weekday Cohort' },
    mentor,
    startTime: '2026-07-21T08:30:00.000Z',
    endTime: '2026-07-21T09:30:00.000Z',
    timezone: 'UTC',
    meetingProvider: null,
    meetingUrl: null,
    location: null,
    status: 'scheduled',
    description: 'Placeholder live class for a non-Graphology program.',
    futureFeatures: comingSoonFeatures,
  },
];

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function buildTeacherCalendarMonth(
  year: number,
  month: number,
  events: TeacherCalendarEventDto[],
  todayKey = '2026-07-17',
): TeacherCalendarMonthDto {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = first.getUTCDay(); // 0 Sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leading = startWeekday;
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;
  const days: TeacherCalendarDayDto[] = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayOffset = index - leading + 1;
    const cellDate = new Date(Date.UTC(year, month - 1, dayOffset));
    const date = toDateKey(cellDate.toISOString());
    const isCurrentMonth = cellDate.getUTCMonth() === month - 1;
    const eventIds = events
      .filter((event) => toDateKey(event.startTime) === date)
      .map((event) => event.id);

    days.push({
      date,
      dayOfMonth: cellDate.getUTCDate(),
      isCurrentMonth,
      isToday: date === todayKey,
      eventIds,
    });
  }

  return {
    year,
    month,
    label: monthLabel(year, month),
    days,
  };
}

export function filterTeacherCalendarEvents(
  events: TeacherCalendarEventDto[],
  query: string,
  filter: TeacherCalendarEventFilter,
): TeacherCalendarEventDto[] {
  const normalized = query.trim().toLowerCase();

  return events.filter((event) => {
    if (filter === 'live_classes' && event.type !== 'live_class') {
      return false;
    }
    if (filter === 'assignments' && event.type !== 'assignment_due') {
      return false;
    }
    if (filter === 'office_hours' && event.type !== 'office_hours') {
      return false;
    }
    if (filter === 'reminders' && event.type !== 'reminder') {
      return false;
    }
    if (filter === 'holidays' && event.type !== 'holiday') {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return (
      event.title.toLowerCase().includes(normalized) ||
      event.description.toLowerCase().includes(normalized) ||
      (event.course?.title.toLowerCase().includes(normalized) ?? false) ||
      (event.course?.slug.toLowerCase().includes(normalized) ?? false) ||
      (event.batch?.name.toLowerCase().includes(normalized) ?? false)
    );
  });
}

export function getTeacherCalendarEventsForDay(
  events: TeacherCalendarEventDto[],
  dateKey: string,
): TeacherCalendarEventDto[] {
  return events
    .filter((event) => toDateKey(event.startTime) === dateKey)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getTeacherCalendarEventById(
  events: TeacherCalendarEventDto[],
  id: string,
): TeacherCalendarEventDto | null {
  return events.find((event) => event.id === id) ?? null;
}

export function shiftTeacherCalendarMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function formatTeacherCalendarDate(iso: string | null): string {
  return formatDashboardDate(iso);
}

export function formatTeacherCalendarDateTime(iso: string | null): string {
  return formatDashboardDateTime(iso);
}

export function getTeacherCalendarDateKey(iso: string): string {
  return toDateKey(iso);
}
