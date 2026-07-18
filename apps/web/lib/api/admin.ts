import { apiFetch } from '../auth/api-client';
import type {
  AdminAuditListDto,
  AdminOrganizationDto,
  AdminOverviewDto,
  AdminPermissionDto,
  AdminRoleDto,
  AdminUserDto,
  AdminUserListDto,
} from '../admin/admin-types';
import {
  mapAdminAuditList,
  mapAdminOrganization,
  mapAdminOverview,
  mapAdminPermissions,
  mapAdminRole,
  mapAdminUser,
  mapAdminUserList,
  type AdminUserApiRecord,
  type AdminUserListApiPayload,
} from './admin-mapper';

export interface AdminListUsersParams {
  organizationId: string;
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminAuditParams {
  organizationId: string;
  search?: string;
  action?: string;
  entity?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAdminUserInput {
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  roleName: 'Admin' | 'Teacher' | 'Student';
}

export interface UpdateAdminUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  isActive?: boolean;
}

export interface UpdateAdminOrganizationInput {
  name?: string;
  slug?: string;
  logo?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  timezone?: string;
  currency?: string;
  language?: string;
  isActive?: boolean;
}

export interface UpdateAdminTeacherInput {
  organizationId: string;
  bio?: string | null;
  qualifications?: string[];
  specializations?: string[];
  experienceYears?: number;
}

function queryString(params: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') &&
      String(value).trim().length > 0
    ) {
      query.set(key, String(value));
    }
  }
  const value = query.toString();
  return value.length > 0 ? `?${value}` : '';
}

export const AdminApi = {
  async getOverview(organizationId: string): Promise<AdminOverviewDto> {
    const payload = await apiFetch<AdminOverviewDto>(
      `/admin/overview${queryString({ organizationId })}`,
    );
    return mapAdminOverview(payload);
  },

  async getUsers(params: AdminListUsersParams): Promise<AdminUserListDto> {
    const payload = await apiFetch<AdminUserListApiPayload>(`/admin/users${queryString(params)}`);
    return mapAdminUserList(payload);
  },

  async getUser(id: string, organizationId: string): Promise<AdminUserDto> {
    const payload = await apiFetch<AdminUserApiRecord>(
      `/admin/users/${id}${queryString({ organizationId })}`,
    );
    return mapAdminUser(payload);
  },

  async createUser(input: CreateAdminUserInput): Promise<AdminUserDto> {
    const payload = await apiFetch<AdminUserApiRecord>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapAdminUser(payload);
  },

  async updateUser(
    id: string,
    organizationId: string,
    input: UpdateAdminUserInput,
  ): Promise<AdminUserDto> {
    const payload = await apiFetch<AdminUserApiRecord>(
      `/admin/users/${id}${queryString({ organizationId })}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return mapAdminUser(payload);
  },

  async assignUserRoles(
    id: string,
    organizationId: string,
    roleIds: string[],
  ): Promise<AdminUserDto> {
    const payload = await apiFetch<AdminUserApiRecord>(`/admin/users/${id}/roles`, {
      method: 'PATCH',
      body: JSON.stringify({ organizationId, roleIds }),
    });
    return mapAdminUser(payload);
  },

  async getRoles(organizationId: string): Promise<AdminRoleDto[]> {
    const payload = await apiFetch<AdminRoleDto[]>(
      `/admin/roles${queryString({ organizationId })}`,
    );
    return payload.map(mapAdminRole);
  },

  async getPermissions(organizationId: string): Promise<AdminPermissionDto[]> {
    const payload = await apiFetch<AdminPermissionDto[]>(
      `/admin/permissions${queryString({ organizationId })}`,
    );
    return mapAdminPermissions(payload);
  },

  async getOrganization(organizationId: string): Promise<AdminOrganizationDto> {
    const payload = await apiFetch<Parameters<typeof mapAdminOrganization>[0]>(
      `/admin/organization${queryString({ organizationId })}`,
    );
    return mapAdminOrganization(payload);
  },

  async updateOrganization(
    id: string,
    input: UpdateAdminOrganizationInput,
  ): Promise<AdminOrganizationDto> {
    const payload = await apiFetch<Parameters<typeof mapAdminOrganization>[0]>(
      `/admin/organization/${id}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return mapAdminOrganization(payload);
  },

  async updateTeacherProfile(
    id: string,
    input: UpdateAdminTeacherInput,
  ): Promise<AdminUserDto['teacherProfile']> {
    return apiFetch<AdminUserDto['teacherProfile']>(`/admin/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async getAuditLogs(params: AdminAuditParams): Promise<AdminAuditListDto> {
    const payload = await apiFetch<AdminAuditListDto>(`/admin/audit-logs${queryString(params)}`);
    return mapAdminAuditList(payload);
  },
};
