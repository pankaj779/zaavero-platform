export const CALENDAR_PROVIDERS = ['NONE', 'GOOGLE', 'OUTLOOK'] as const;

export type CalendarProviderValue = (typeof CALENDAR_PROVIDERS)[number];

export const CALENDAR_SORT_FIELDS = ['startsAt', 'createdAt'] as const;

export type CalendarSortField = (typeof CALENDAR_SORT_FIELDS)[number];

export const CALENDAR_DEFAULT_PAGE = 1;
export const CALENDAR_DEFAULT_LIMIT = 20;
export const CALENDAR_MAX_LIMIT = 100;
