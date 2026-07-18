import type { TeacherDashboardDto } from '../teacher/dashboard-types';
import { AnalyticsApi } from './analytics';
import { mapTeacherDashboard } from './dashboard-mapper';
import { NotificationApi } from './notification';

export const TeacherDashboardApi = {
  async getDashboard(organizationId: string, userId: string): Promise<TeacherDashboardDto> {
    const [source, notificationResult] = await Promise.all([
      AnalyticsApi.getSource(organizationId),
      NotificationApi.getNotifications({
        organizationId,
        userId,
        channel: 'IN_APP',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    ]);

    return mapTeacherDashboard(source, notificationResult.items);
  },
};
