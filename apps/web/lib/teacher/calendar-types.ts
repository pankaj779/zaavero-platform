import { formatDashboardDate, formatDashboardDateTime } from '../dashboard/format-date';

/**
 * Teacher Calendar workspace DTOs and pure helpers.
 * Backend source of truth: NestJS `/api/v1/calendar-events`.
 */

export type TeacherCalendarEventType =
  'live_class' | 'assignment_due' | 'office_hours' | 'holiday' | 'reminder';

export type TeacherCalendarEventStatus = 'scheduled' | 'completed' | 'cancelled' | 'tentative';
export type TeacherCalendarViewState = 'loading' | 'empty' | 'error' | 'populated';
export type TeacherCalendarEventFilter =
  'all' | 'live_classes' | 'assignments' | 'office_hours' | 'reminders' | 'holidays';

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

/** Primary list DTO for the Teacher Calendar workspace. */
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
  /** ISO date key YYYY-MM-DD (UTC calendar day). */
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

export const teacherCalendarComingSoonFeatures: TeacherCalendarFutureFeaturesDto = {
  googleCalendar: 'coming_soon',
  outlook: 'coming_soon',
  meetingProvisioning: 'coming_soon',
  reminders: 'coming_soon',
};

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

/** Current UTC calendar month for the workspace. */
export function getTeacherCalendarInitialMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

/** YYYY-MM-DD for the current UTC calendar day. */
export function getTeacherCalendarTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Inclusive `from`/`to` ISO range covering the Sunday-first month grid
 * (including leading/trailing days from adjacent months).
 */
export function getTeacherCalendarMonthRange(
  year: number,
  month: number,
): { from: string; to: string } {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const rangeStart = new Date(Date.UTC(year, month - 1, 1 - startWeekday, 0, 0, 0, 0));
  const rangeEnd = new Date(
    Date.UTC(year, month - 1, 1 - startWeekday + totalCells, 0, 0, 0, 0) - 1,
  );
  return { from: rangeStart.toISOString(), to: rangeEnd.toISOString() };
}

/** Maps UI list preferences to NestJS calendar list sort params. */
export function toCalendarListSort(): {
  sortBy: 'startsAt' | 'createdAt';
  sortOrder: 'asc' | 'desc';
} {
  return { sortBy: 'startsAt', sortOrder: 'asc' };
}

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
  todayKey = getTeacherCalendarTodayKey(),
): TeacherCalendarMonthDto {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = first.getUTCDay();
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
