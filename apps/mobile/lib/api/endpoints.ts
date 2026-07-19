import { apiFetch } from './client';

/**
 * Mobile API modules. Each function calls the SAME NestJS endpoint that web
 * uses via apiFetch — no forked backend logic, no mock data. Response DTOs are
 * produced by the backend; here we type the fields the mobile UI consumes.
 */

export interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ListParams {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const s = query.toString();
  return s ? `?${s}` : '';
}

function listQs(params: ListParams, extra: Record<string, string | number | undefined> = {}): string {
  return qs({
    organizationId: params.organizationId,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    search: params.search,
    status: params.status,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    ...extra,
  });
}

// ---------------------------------------------------------------------------
// Shared record shapes (subset of backend DTO fields consumed by mobile)
// ---------------------------------------------------------------------------

export interface CourseRecord {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: string;
  difficulty?: string | null;
  language?: string | null;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  lessonCount?: number;
  enrollmentCount?: number;
  updatedAt?: string;
}

export interface LessonRecord {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  order?: number;
  contentType?: string;
  contentUrl?: string | null;
  videoUrl?: string | null;
  durationMinutes?: number | null;
  status?: string;
}

export interface AssignmentRecord {
  id: string;
  courseId?: string | null;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  status?: string;
  maxScore?: number | null;
}

export interface LiveSessionRecord {
  id: string;
  title: string;
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
  meetingUrl?: string | null;
  provider?: string | null;
  courseId?: string | null;
}

export interface AttendanceRecord {
  id: string;
  status: string;
  sessionTitle?: string | null;
  date?: string | null;
  markedAt?: string | null;
}

export interface CertificateRecord {
  id: string;
  title?: string | null;
  courseTitle?: string | null;
  status: string;
  issuedAt?: string | null;
  verificationCode?: string | null;
  downloadUrl?: string | null;
}

export interface CalendarEventRecord {
  id: string;
  title: string;
  type?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  description?: string | null;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body?: string | null;
  read?: boolean;
  readAt?: string | null;
  createdAt?: string | null;
  type?: string;
}

export interface ConversationRecord {
  id: string;
  title?: string | null;
  lastMessagePreview?: string | null;
  updatedAt?: string | null;
  unreadCount?: number;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderId?: string | null;
  body: string;
  createdAt?: string | null;
}

export interface EnrollmentRecord {
  id: string;
  courseId: string;
  courseTitle?: string | null;
  status: string;
  progress?: number | null;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[];
  isActive?: boolean;
  createdAt?: string | null;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  entityType?: string | null;
  actorEmail?: string | null;
  createdAt?: string | null;
}

// ---------------------------------------------------------------------------
// Courses / Lessons / Enrollments / Progress
// ---------------------------------------------------------------------------

export const CoursesApi = {
  list(params: ListParams) {
    return apiFetch<Paginated<CourseRecord>>(`/courses${listQs(params)}`);
  },
  get(id: string) {
    return apiFetch<CourseRecord>(`/courses/${id}`);
  },
};

export const LessonsApi = {
  list(organizationId: string, courseId?: string, page = 1, limit = 50) {
    return apiFetch<Paginated<LessonRecord>>(
      `/lessons${qs({ organizationId, courseId, page, limit })}`,
    );
  },
  get(id: string) {
    return apiFetch<LessonRecord>(`/lessons/${id}`);
  },
};

export const LessonProgressApi = {
  upsert(body: { organizationId: string; lessonId: string; status: string; progress?: number }) {
    return apiFetch<{ id: string }>(`/lesson-progress`, { method: 'POST', body });
  },
};

export const EnrollmentsApi = {
  list(params: ListParams) {
    return apiFetch<Paginated<EnrollmentRecord>>(`/enrollments${listQs(params)}`);
  },
};

// ---------------------------------------------------------------------------
// Assignments / Live sessions / Attendance / Certificates
// ---------------------------------------------------------------------------

export const AssignmentsApi = {
  list(params: ListParams) {
    return apiFetch<Paginated<AssignmentRecord>>(`/assignments${listQs(params)}`);
  },
  get(id: string) {
    return apiFetch<AssignmentRecord>(`/assignments/${id}`);
  },
};

export const LiveSessionsApi = {
  list(params: ListParams) {
    return apiFetch<Paginated<LiveSessionRecord>>(`/live-sessions${listQs(params)}`);
  },
  get(id: string) {
    return apiFetch<LiveSessionRecord>(`/live-sessions/${id}`);
  },
  start(id: string) {
    return apiFetch<LiveSessionRecord>(`/live-sessions/${id}/start`, { method: 'POST', body: {} });
  },
  end(id: string) {
    return apiFetch<LiveSessionRecord>(`/live-sessions/${id}/end`, { method: 'POST', body: {} });
  },
  cancel(id: string) {
    return apiFetch<LiveSessionRecord>(`/live-sessions/${id}/cancel`, { method: 'POST', body: {} });
  },
};

export const AttendanceApi = {
  list(params: ListParams) {
    return apiFetch<Paginated<AttendanceRecord>>(`/attendances${listQs(params)}`);
  },
};

export const CertificatesApi = {
  list(params: ListParams) {
    return apiFetch<Paginated<CertificateRecord>>(`/certificates${listQs(params)}`);
  },
  get(id: string) {
    return apiFetch<CertificateRecord>(`/certificates/${id}`);
  },
};

// ---------------------------------------------------------------------------
// Calendar / Notifications / Messaging
// ---------------------------------------------------------------------------

export const CalendarApi = {
  list(organizationId: string, from?: string, to?: string) {
    return apiFetch<Paginated<CalendarEventRecord>>(
      `/calendar-events${qs({ organizationId, from, to, limit: 100 })}`,
    );
  },
};

export const NotificationsApi = {
  list(organizationId: string, page = 1, limit = 30) {
    return apiFetch<Paginated<NotificationRecord>>(
      `/notifications${qs({ organizationId, page, limit })}`,
    );
  },
  markRead(id: string) {
    return apiFetch<NotificationRecord>(`/notifications/${id}/read`, { method: 'POST', body: {} });
  },
  markAllRead(organizationId: string) {
    return apiFetch<{ updated: number }>(
      `/notifications/read-all${qs({ organizationId })}`,
      { method: 'POST', body: {} },
    );
  },
};

export const MessagingApi = {
  listConversations(organizationId: string, page = 1, limit = 30) {
    return apiFetch<Paginated<ConversationRecord>>(
      `/conversations${qs({ organizationId, page, limit })}`,
    );
  },
  listMessages(conversationId: string, page = 1, limit = 50) {
    return apiFetch<Paginated<MessageRecord>>(
      `/conversations/${conversationId}/messages${qs({ page, limit })}`,
    );
  },
  sendMessage(conversationId: string, body: string) {
    return apiFetch<MessageRecord>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { body },
    });
  },
};

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export interface PaymentConfigRecord {
  provider: string;
  keyId?: string | null;
  currency?: string;
}
export interface PaymentOrderRecord {
  id: string;
  amount: number;
  currency: string;
  providerOrderId?: string | null;
  status?: string;
}
export interface InvoiceRecord {
  id: string;
  number?: string | null;
  amount: number;
  currency: string;
  status: string;
  issuedAt?: string | null;
  downloadUrl?: string | null;
}

export const PaymentsApi = {
  config() {
    return apiFetch<PaymentConfigRecord>('/payments/config');
  },
  createOrder(body: { organizationId: string; planId?: string; courseId?: string; amount?: number }) {
    return apiFetch<PaymentOrderRecord>('/payments/orders', { method: 'POST', body });
  },
  verify(body: Record<string, unknown>) {
    return apiFetch<PaymentOrderRecord>('/payments/verify', { method: 'POST', body });
  },
  invoices(params: ListParams) {
    return apiFetch<Paginated<InvoiceRecord>>(`/payments/invoices${listQs(params)}`);
  },
};

// ---------------------------------------------------------------------------
// AI (reuses the Phase 16 platform)
// ---------------------------------------------------------------------------

export interface AIConversationRecord {
  id: string;
  title?: string | null;
  feature: string;
  updatedAt?: string | null;
  pinned?: boolean;
}
export interface AIMessageRecord {
  id: string;
  role: string;
  content: string;
  createdAt?: string | null;
}

export const AiApi = {
  listConversations(organizationId: string, feature?: string, limit = 20) {
    return apiFetch<Paginated<AIConversationRecord>>(
      `/ai/student/conversations${qs({ organizationId, feature, limit })}`,
    );
  },
  getConversation(organizationId: string, id: string) {
    return apiFetch<{ conversation: AIConversationRecord; messages: AIMessageRecord[] }>(
      `/ai/student/conversations/${id}${qs({ organizationId })}`,
    );
  },
  feedback(messageId: string, body: { organizationId: string; rating: 'UP' | 'DOWN'; reason?: string }) {
    return apiFetch<{ saved: boolean }>(`/ai/student/messages/${messageId}/feedback`, {
      method: 'POST',
      body,
    });
  },
  quota(organizationId: string) {
    return apiFetch<unknown>(`/ai/student/quota${qs({ organizationId })}`);
  },
  teacherGenerate(body: Record<string, unknown>) {
    return apiFetch<unknown>('/ai/teacher/generate', { method: 'POST', body });
  },
  adminHealth() {
    return apiFetch<unknown>('/ai/admin/provider/health');
  },
  adminUsage(organizationId: string, days = 30) {
    return apiFetch<unknown>(`/ai/admin/usage${qs({ organizationId, days })}`);
  },
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const AdminApi = {
  listUsers(params: ListParams & { role?: string }) {
    return apiFetch<Paginated<AdminUserRecord>>(
      `/admin/users${listQs(params, { role: params.role })}`,
    );
  },
  updateUserRoles(id: string, roles: string[]) {
    return apiFetch<AdminUserRecord>(`/admin/users/${id}/roles`, {
      method: 'PATCH',
      body: { roles },
    });
  },
  auditLogs(params: ListParams) {
    return apiFetch<Paginated<AuditLogRecord>>(`/admin/audit-logs${listQs(params)}`);
  },
};

// ---------------------------------------------------------------------------
// Storage / media (reuses Cloudinary-backed storage endpoints)
// ---------------------------------------------------------------------------

export const StorageApi = {
  updateAvatar(body: { assetId?: string; profileImage?: string | null }) {
    return apiFetch<{ profileImage: string | null }>('/auth/me/avatar', {
      method: 'PATCH',
      body,
    });
  },
  signUpload(body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>('/storage/uploads/sign', { method: 'POST', body });
  },
  finalizeUpload(body: Record<string, unknown>) {
    return apiFetch<Record<string, unknown>>('/storage/uploads/finalize', { method: 'POST', body });
  },
};
