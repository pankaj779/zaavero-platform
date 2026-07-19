export const LIVE_SESSION_STATUSES = ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'] as const;
export type LiveSessionStatusValue = (typeof LIVE_SESSION_STATUSES)[number];
export const MEETING_PROVIDERS = ['NONE', 'ZOOM', 'GOOGLE_MEET', 'CUSTOM', 'SANDBOX'] as const;
export type MeetingProviderValue = (typeof MEETING_PROVIDERS)[number];
export const LIVE_SESSION_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'startsAt',
  'title',
  'status',
] as const;
export type LiveSessionSortField = (typeof LIVE_SESSION_SORT_FIELDS)[number];
export const LIVE_SESSION_DEFAULT_PAGE = 1;
export const LIVE_SESSION_DEFAULT_LIMIT = 20;
export const LIVE_SESSION_MAX_LIMIT = 100;
