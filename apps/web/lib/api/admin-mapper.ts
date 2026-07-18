import type {
  AdminAuditListDto,
  AdminAuditLogDto,
  AdminOrganizationDto,
  AdminOverviewDto,
  AdminPermissionDto,
  AdminRoleDto,
  AdminUserDto,
  AdminUserListDto,
} from '../admin/admin-types';

export type AdminUserApiRecord = Omit<AdminUserDto, 'fullName' | 'initials'>;
export interface AdminUserListApiPayload extends Omit<AdminUserListDto, 'items'> {
  items: AdminUserApiRecord[];
}

function initials(firstName: string, lastName: string): string {
  const value = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return value.length > 0 ? value : 'US';
}

export function mapAdminUser(record: AdminUserApiRecord): AdminUserDto {
  const fullName = `${record.firstName} ${record.lastName}`.trim();
  return {
    ...record,
    fullName: fullName.length > 0 ? fullName : record.email,
    initials: initials(record.firstName, record.lastName),
  };
}

export function mapAdminUserList(payload: AdminUserListApiPayload): AdminUserListDto {
  return { items: payload.items.map(mapAdminUser), meta: payload.meta };
}

export function mapAdminOverview(payload: AdminOverviewDto): AdminOverviewDto {
  return payload;
}

export function mapAdminRole(record: AdminRoleDto): AdminRoleDto {
  return {
    ...record,
    permissions: record.permissions?.map((permission) => ({ ...permission })) ?? [],
  };
}

export function mapAdminPermissions(records: AdminPermissionDto[]): AdminPermissionDto[] {
  return records.map((record) => ({ ...record }));
}

interface AdminOrganizationApiRecord extends Omit<AdminOrganizationDto, 'counts'> {
  _count: { members: number; courses: number; batches: number };
}

export function mapAdminOrganization(record: AdminOrganizationApiRecord): AdminOrganizationDto {
  const { _count, ...organization } = record;
  return { ...organization, counts: _count };
}

export function mapAdminAuditLog(record: AdminAuditLogDto): AdminAuditLogDto {
  return { ...record };
}

export function mapAdminAuditList(payload: AdminAuditListDto): AdminAuditListDto {
  return { items: payload.items.map(mapAdminAuditLog), meta: payload.meta };
}
