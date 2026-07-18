import type { IconName } from '../constants/icons';

export interface TeacherStatDto {
  id: string;
  label: string;
  value: string;
  helper: string;
  icon: IconName;
}

export interface TeacherDashboardItemDto {
  id: string;
  title: string;
  detail: string;
}

export interface TeacherDashboardSectionDto {
  id: string;
  title: string;
  description: string;
  emptyLabel: string;
  items: TeacherDashboardItemDto[];
}

export interface TeacherDashboardDto {
  stats: TeacherStatDto[];
  todaysClasses: TeacherDashboardSectionDto;
  upcomingWork: TeacherDashboardSectionDto;
  recentActivity: TeacherDashboardSectionDto;
}

export const teacherDashboardCopy = {
  errorTitle: 'Unable to load your teaching dashboard',
  errorDescription: 'Something went wrong while loading the latest teaching data.',
  retryButton: 'Retry',
  loadingLabel: 'Loading teaching dashboard…',
} as const;
