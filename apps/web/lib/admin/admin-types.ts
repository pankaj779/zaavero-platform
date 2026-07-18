export interface AdminListMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminRoleDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount?: number;
  permissions?: AdminPermissionDto[];
}

export interface AdminPermissionDto {
  id: string;
  name: string;
  module: string;
  description: string | null;
}

export interface AdminTeacherProfileDto {
  id: string;
  organizationId: string;
  bio: string | null;
  qualifications: string[];
  specializations: string[];
  experienceYears: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStudentProfileDto {
  id: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  membership: {
    id: string;
    status: string;
    joinedAt: string;
  };
  roles: AdminRoleDto[];
  teacherProfile: AdminTeacherProfileDto | null;
  studentProfile: AdminStudentProfileDto | null;
}

export interface AdminUserListDto {
  items: AdminUserDto[];
  meta: AdminListMetaDto;
}

export interface AdminRecentEnrollmentDto {
  id: string;
  status: string;
  enrolledAt: string;
  studentId: string;
  course: { id: string; title: string };
  batch: { id: string; name: string };
}

export interface AdminRecentCertificateDto {
  id: string;
  status: string;
  issuedAt: string | null;
  certificateNumber: string | null;
  studentId: string;
  course: { id: string; title: string };
}

export interface AdminRecentAssignmentDto {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  createdAt: string;
  course: { id: string; title: string };
}

export interface AdminAuditLogDto {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface AdminAuditListDto {
  items: AdminAuditLogDto[];
  meta: AdminListMetaDto;
}

export interface AdminOverviewDto {
  organizationId: string;
  generatedAt: string;
  counts: {
    users: number;
    teachers: number;
    students: number;
    courses: number;
    batches: number;
    enrollments: number;
    assignments: number;
    submissions: number;
    certificates: number;
    attendances: number;
    liveSessions: number;
    notifications: number;
  };
  revenue: null;
  recentEnrollments: AdminRecentEnrollmentDto[];
  recentCertificates: AdminRecentCertificateDto[];
  recentAssignments: AdminRecentAssignmentDto[];
  recentActivity: AdminAuditLogDto[];
  systemStatus: {
    api: string;
    database: string;
    payments: string;
    email: string;
  };
}

export interface AdminOrganizationDto {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  currency: string;
  language: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  counts: { members: number; courses: number; batches: number };
}
