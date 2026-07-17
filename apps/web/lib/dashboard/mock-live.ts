/**
 * Live Classes DTOs — shaped like future GET /student/live-classes responses.
 * No real meeting URLs or integrations in this sprint.
 */

import { formatDashboardDateWithWeekday } from './format-date';

export type LiveClassViewState = 'loading' | 'empty' | 'error' | 'populated';

export type LiveClassStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export type MeetingPlatform = 'google_meet' | 'zoom' | 'other' | 'tbd';

export interface LiveCourseRefDto {
  id: string;
  slug: string;
  title: string;
}

export interface LiveMentorDto {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
}

export interface LiveDurationDto {
  minutes: number;
  label: string;
}

export interface LiveThumbnailDto {
  url: string | null;
  alt: string;
}

export interface LiveMeetingDetailsDto {
  platform: MeetingPlatform;
  platformLabel: string;
  meetingIdPlaceholder: string;
  passwordPlaceholder: string;
  requirements: string[];
  preparation: string[];
  joinInstructions: string;
}

/** Future expansion flags — architecture only */
export interface LiveFutureFeaturesDto {
  googleMeetEnabled: boolean;
  zoomEnabled: boolean;
  notificationsEnabled: boolean;
  attendanceEnabled: boolean;
  recordingPlaybackEnabled: boolean;
  remindersEnabled: boolean;
  calendarSyncEnabled: boolean;
}

export interface LiveClassDto {
  id: string;
  title: string;
  course: LiveCourseRefDto;
  mentor: LiveMentorDto;
  startTime: string;
  endTime: string;
  timezone: string;
  meetingPlatform: MeetingPlatform;
  /** Always null until backend integration — never invent join URLs */
  meetingUrl: string | null;
  status: LiveClassStatus;
  description: string;
  duration: LiveDurationDto;
  isToday: boolean;
  isLive: boolean;
  recordingAvailable: boolean;
  thumbnail: LiveThumbnailDto;
  meetingDetails: LiveMeetingDetailsDto;
  futureFeatures: LiveFutureFeaturesDto;
}

export const liveViewState: LiveClassViewState = 'populated';

export const livePageCopy = {
  title: 'Live Classes',
  description: 'Prepare for live sessions with your mentor. Joining will be available soon.',
  todaysTitle: "Today's Live Session",
  todaysEmpty: 'No live session scheduled for today.',
  upcomingTitle: 'Upcoming Classes',
  upcomingEmpty: 'No upcoming live classes yet.',
  calendarTitle: 'Calendar',
  instructorTitle: 'Instructor',
  meetingDetailsTitle: 'Meeting Details',
  joinComingSoon: 'Coming Soon',
  viewDetails: 'View Details',
  emptyTitle: 'No live classes yet',
  emptyDescription:
    'When live sessions are scheduled for your programs, they will appear here with join details.',
  errorTitle: 'Unable to load live classes',
  errorDescription: 'Something went wrong while loading live classes. Please try again.',
  courseLabel: 'Course',
  mentorLabel: 'Mentor',
  dateLabel: 'Date',
  timeLabel: 'Time',
  durationLabel: 'Duration',
  timezoneLabel: 'Timezone',
  statusLabel: 'Status',
  countdownLabel: 'Starts in',
  countdownLive: 'Session is live',
  countdownEnded: 'Session ended',
  platformLabel: 'Platform',
  meetingIdLabel: 'Meeting ID',
  passwordLabel: 'Password',
  requirementsLabel: 'Requirements',
  preparationLabel: 'What to prepare',
  instructionsLabel: 'Join instructions',
  calendarPrev: 'Previous month',
  calendarNext: 'Next month',
} as const;

export const liveStatusLabel: Record<LiveClassStatus, string> = {
  scheduled: 'Scheduled',
  live: 'Live',
  ended: 'Ended',
  cancelled: 'Cancelled',
};

export const meetingPlatformLabel: Record<MeetingPlatform, string> = {
  google_meet: 'Google Meet',
  zoom: 'Zoom',
  other: 'Other',
  tbd: 'Platform TBD',
};

const defaultFutureFeatures: LiveFutureFeaturesDto = {
  googleMeetEnabled: false,
  zoomEnabled: false,
  notificationsEnabled: false,
  attendanceEnabled: false,
  recordingPlaybackEnabled: false,
  remindersEnabled: false,
  calendarSyncEnabled: false,
};

const placeholderMentor: LiveMentorDto = {
  id: 'teacher_001',
  name: 'Placeholder Instructor',
  role: 'Mentor',
  bio: 'Mentor bio placeholder. Full profile details will appear when published.',
  avatarUrl: null,
};

const defaultMeetingDetails = (platform: MeetingPlatform): LiveMeetingDetailsDto => ({
  platform,
  platformLabel: meetingPlatformLabel[platform],
  meetingIdPlaceholder: 'Meeting ID placeholder',
  passwordPlaceholder: 'Password placeholder',
  requirements: [
    'Stable internet connection',
    'Quiet space for participation',
    'Notebook for session notes',
  ],
  preparation: [
    'Review the related course module',
    'Prepare questions for the mentor',
    'Join a few minutes early when joining is enabled',
  ],
  joinInstructions:
    'Join instructions placeholder. Meeting access will be provided when live integrations are connected.',
});

function atLocalDay(dayOffset: number, hour: number, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function toIso(date: Date): string {
  return date.toISOString();
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildClass(input: {
  id: string;
  title: string;
  courseTitle: string;
  courseSlug: string;
  start: Date;
  end: Date;
  status: LiveClassStatus;
  platform: MeetingPlatform;
  description: string;
}): LiveClassDto {
  const now = new Date();
  const durationMinutes = Math.max(
    1,
    Math.round((input.end.getTime() - input.start.getTime()) / 60000),
  );

  return {
    id: input.id,
    title: input.title,
    course: {
      id: `course_${input.courseSlug}`,
      slug: input.courseSlug,
      title: input.courseTitle,
    },
    mentor: placeholderMentor,
    startTime: toIso(input.start),
    endTime: toIso(input.end),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    meetingPlatform: input.platform,
    meetingUrl: null,
    status: input.status,
    description: input.description,
    duration: {
      minutes: durationMinutes,
      label: `${String(durationMinutes)} min`,
    },
    isToday: isSameLocalDay(input.start, now),
    isLive: input.status === 'live',
    recordingAvailable: false,
    thumbnail: {
      url: null,
      alt: 'Live class thumbnail placeholder',
    },
    meetingDetails: defaultMeetingDetails(input.platform),
    futureFeatures: defaultFutureFeatures,
  };
}

/** Demo catalog — times are relative to “now” so Today / countdown stay meaningful. */
export const liveClasses: LiveClassDto[] = [
  buildClass({
    id: 'live_001',
    title: 'Live Session: Foundations Review',
    courseTitle: 'Graphology Foundations',
    courseSlug: 'graphology-foundation',
    start: atLocalDay(0, 18, 0),
    end: atLocalDay(0, 19, 0),
    status: 'scheduled',
    platform: 'google_meet',
    description: 'Live session description placeholder for today’s foundations review.',
  }),
  buildClass({
    id: 'live_002',
    title: 'Live Session: Stroke Analysis Q&A',
    courseTitle: 'Graphology Foundations',
    courseSlug: 'graphology-foundation',
    start: atLocalDay(2, 17, 30),
    end: atLocalDay(2, 18, 30),
    status: 'scheduled',
    platform: 'zoom',
    description: 'Upcoming live session description placeholder.',
  }),
  buildClass({
    id: 'live_003',
    title: 'Live Session: Practice Lab',
    courseTitle: 'Advanced Graphology',
    courseSlug: 'advanced-graphology',
    start: atLocalDay(5, 19, 0),
    end: atLocalDay(5, 20, 15),
    status: 'scheduled',
    platform: 'tbd',
    description: 'Upcoming practice lab description placeholder.',
  }),
  buildClass({
    id: 'live_004',
    title: 'Live Session: Handwriting Clinic',
    courseTitle: 'Handwriting Improvement',
    courseSlug: 'handwriting-improvement',
    start: atLocalDay(9, 16, 0),
    end: atLocalDay(9, 17, 0),
    status: 'scheduled',
    platform: 'google_meet',
    description: 'Upcoming clinic description placeholder.',
  }),
];

export function getTodaysLiveClass(classes: LiveClassDto[] = liveClasses): LiveClassDto | null {
  return classes.find((item) => item.isToday && item.status !== 'cancelled') ?? null;
}

export function getUpcomingLiveClasses(classes: LiveClassDto[] = liveClasses): LiveClassDto[] {
  const now = Date.now();
  return classes
    .filter((item) => !item.isToday && item.status === 'scheduled')
    .filter((item) => new Date(item.startTime).getTime() >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getFeaturedLiveClass(classes: LiveClassDto[] = liveClasses): LiveClassDto | null {
  return getTodaysLiveClass(classes) ?? getUpcomingLiveClasses(classes)[0] ?? null;
}

export function getLiveClassDateKeys(classes: LiveClassDto[] = liveClasses): string[] {
  return classes.map((item) => toLocalDateKey(new Date(item.startTime)));
}

export function toLocalDateKey(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLiveDate(iso: string): string {
  return formatDashboardDateWithWeekday(iso);
}

export function formatLiveTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Time placeholder';
  }
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLiveTimeRange(startIso: string, endIso: string): string {
  return `${formatLiveTime(startIso)} – ${formatLiveTime(endIso)}`;
}
