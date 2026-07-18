import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { hash } from 'argon2';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { StorageService } from '../../storage/services/storage.service';
import type {
  AdminAuditQueryDto,
  AdminListQueryDto,
  AssignUserRolesDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  UpdateOrganizationDto,
  UpdateTeacherProfileDto,
} from '../dto/admin.dto';

type AdminPayload = ControllerSuccessPayload<unknown>;
type AuditMetadata = Record<string, string | number | boolean | null | string[]>;

@Injectable()
export class AdminService {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly storageService: StorageService,
  ) {}

  async overview(user: AuthenticatedUser, organizationId?: string): Promise<AdminPayload> {
    const orgId = this.resolveOrganizationId(user, organizationId);
    const now = new Date();
    const [
      users,
      teachers,
      students,
      courses,
      batches,
      enrollments,
      assignments,
      submissions,
      certificates,
      attendances,
      liveSessions,
      notifications,
      recentEnrollments,
      recentCertificates,
      recentAssignments,
      recentActivity,
    ] = await Promise.all([
      this.prisma.organizationMember.count({
        where: { organizationId: orgId, status: 'ACTIVE', user: { deletedAt: null } },
      }),
      this.prisma.teacherProfile.count({
        where: { organizationId: orgId, deletedAt: null },
      }),
      this.prisma.studentProfile.count({
        where: { organizationId: orgId, deletedAt: null },
      }),
      this.prisma.course.count({ where: { organizationId: orgId, deletedAt: null } }),
      this.prisma.batch.count({ where: { organizationId: orgId, deletedAt: null } }),
      this.prisma.enrollment.count({ where: { organizationId: orgId } }),
      this.prisma.assignment.count({ where: { organizationId: orgId, deletedAt: null } }),
      this.prisma.assignmentSubmission.count({ where: { organizationId: orgId } }),
      this.prisma.certificate.count({ where: { organizationId: orgId } }),
      this.prisma.attendance.count({ where: { organizationId: orgId } }),
      this.prisma.liveSession.count({ where: { organizationId: orgId, deletedAt: null } }),
      this.prisma.notification.count({ where: { organizationId: orgId } }),
      this.prisma.enrollment.findMany({
        where: { organizationId: orgId },
        orderBy: { enrolledAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          studentId: true,
          course: { select: { id: true, title: true } },
          batch: { select: { id: true, name: true } },
        },
      }),
      this.prisma.certificate.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          issuedAt: true,
          certificateNumber: true,
          studentId: true,
          course: { select: { id: true, title: true } },
        },
      }),
      this.prisma.assignment.findMany({
        where: { organizationId: orgId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          dueAt: true,
          createdAt: true,
          course: { select: { id: true, title: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        where: {
          user: {
            organizationMembers: { some: { organizationId: orgId } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          createdAt: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    return {
      message: 'Admin dashboard retrieved successfully.',
      data: {
        organizationId: orgId,
        generatedAt: now.toISOString(),
        counts: {
          users,
          teachers,
          students,
          courses,
          batches,
          enrollments,
          assignments,
          submissions,
          certificates,
          attendances,
          liveSessions,
          notifications,
        },
        revenue: null,
        recentEnrollments,
        recentCertificates,
        recentAssignments,
        recentActivity,
        systemStatus: {
          api: 'operational',
          database: 'operational',
          payments: 'not_configured',
          email: 'configured_by_environment',
        },
      },
    };
  }

  async listUsers(user: AuthenticatedUser, query: AdminListQueryDto): Promise<AdminPayload> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    const search = query.search?.trim();
    const where = {
      organizationId,
      ...(query.isActive === undefined
        ? {}
        : { user: { isActive: query.isActive, deletedAt: null } }),
      ...(search
        ? {
            user: {
              ...(query.isActive === undefined
                ? { deletedAt: null }
                : { isActive: query.isActive, deletedAt: null }),
              OR: [
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
              ],
            },
          }
        : query.isActive === undefined
          ? { user: { deletedAt: null } }
          : {}),
      ...(query.role
        ? { user: { userRoles: { some: { role: { name: query.role } } }, deletedAt: null } }
        : {}),
    };
    const [total, members] = await Promise.all([
      this.prisma.organizationMember.count({ where }),
      this.prisma.organizationMember.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { user: { [query.sortBy]: query.sortOrder } },
        include: {
          user: {
            include: {
              userRoles: { include: { role: true } },
              teacherProfiles: { where: { organizationId, deletedAt: null }, take: 1 },
              studentProfiles: { where: { organizationId, deletedAt: null }, take: 1 },
            },
          },
        },
      }),
    ]);
    return {
      message: 'Admin users retrieved successfully.',
      data: {
        items: members.map((member) => this.mapMember(member)),
        meta: this.pageMeta(total, query.page, query.limit),
      },
    };
  }

  async getUser(
    user: AuthenticatedUser,
    id: string,
    organizationId?: string,
  ): Promise<AdminPayload> {
    const orgId = this.resolveOrganizationId(user, organizationId);
    const member = await this.requireMember(orgId, id);
    return {
      message: 'Admin user retrieved successfully.',
      data: this.mapMember(member),
    };
  }

  async createUser(user: AuthenticatedUser, dto: CreateAdminUserDto): Promise<AdminPayload> {
    const organizationId = this.resolveOrganizationId(user, dto.organizationId);
    const role = await this.prisma.role.findUnique({ where: { name: dto.roleName } });
    if (!role) {
      throw new BadRequestException(`Role ${dto.roleName} is not configured.`);
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('A user with this email already exists.');
    }
    const passwordHash = await hash(dto.password);
    const created = await this.prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.create({
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email.toLowerCase(),
          phone: dto.phone?.trim(),
          passwordHash,
          emailVerified: false,
          createdById: user.id,
        },
      });
      await tx.organizationMember.create({
        data: { organizationId, userId: nextUser.id, status: 'ACTIVE' },
      });
      await tx.userRole.create({ data: { userId: nextUser.id, roleId: role.id } });
      if (dto.roleName === 'Teacher') {
        await tx.teacherProfile.create({ data: { organizationId, userId: nextUser.id } });
      } else if (dto.roleName === 'Student') {
        await tx.studentProfile.create({ data: { organizationId, userId: nextUser.id } });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'admin.user.create',
          entity: 'User',
          entityId: nextUser.id,
          metadata: { organizationId, role: dto.roleName },
        },
      });
      return nextUser;
    });
    return this.getUser(user, created.id, organizationId);
  }

  async updateUser(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateAdminUserDto,
    organizationId?: string,
  ): Promise<AdminPayload> {
    const orgId = this.resolveOrganizationId(user, organizationId);
    await this.requireMember(orgId, id);
    await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        isActive: dto.isActive,
        updatedById: user.id,
      },
    });
    await this.writeAudit(user.id, 'admin.user.update', 'User', id, { organizationId: orgId });
    return this.getUser(user, id, orgId);
  }

  async assignRoles(
    user: AuthenticatedUser,
    id: string,
    dto: AssignUserRolesDto,
  ): Promise<AdminPayload> {
    const organizationId = this.resolveOrganizationId(user, dto.organizationId);
    await this.requireMember(organizationId, id);
    const roles = await this.prisma.role.findMany({ where: { id: { in: dto.roleIds } } });
    if (roles.length !== dto.roleIds.length) {
      throw new BadRequestException('One or more roles do not exist.');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      if (dto.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
      const roleNames = new Set(roles.map((role) => role.name));
      if (roleNames.has('Teacher')) {
        await tx.teacherProfile.upsert({
          where: { organizationId_userId: { organizationId, userId: id } },
          create: { organizationId, userId: id },
          update: { deletedAt: null },
        });
      }
      if (roleNames.has('Student')) {
        await tx.studentProfile.upsert({
          where: { organizationId_userId: { organizationId, userId: id } },
          create: { organizationId, userId: id },
          update: { deletedAt: null },
        });
      }
    });
    await this.writeAudit(user.id, 'admin.user.roles.update', 'User', id, {
      organizationId,
      roleIds: dto.roleIds,
    });
    return this.getUser(user, id, organizationId);
  }

  async listRoles(user: AuthenticatedUser, organizationId?: string): Promise<AdminPayload> {
    this.resolveOrganizationId(user, organizationId);
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
    return {
      message: 'Roles retrieved successfully.',
      data: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        userCount: role._count.userRoles,
        permissions: role.rolePermissions.map(({ permission }) => ({
          id: permission.id,
          name: permission.name,
          module: permission.module,
          description: permission.description,
        })),
      })),
    };
  }

  async listPermissions(user: AuthenticatedUser, organizationId?: string): Promise<AdminPayload> {
    this.resolveOrganizationId(user, organizationId);
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });
    return { message: 'Permissions retrieved successfully.', data: permissions };
  }

  async getOrganization(user: AuthenticatedUser, id?: string): Promise<AdminPayload> {
    const organizationId = this.resolveOrganizationId(user, id);
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { _count: { select: { members: true, courses: true, batches: true } } },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }
    return { message: 'Organization retrieved successfully.', data: organization };
  }

  async updateOrganization(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<AdminPayload> {
    const organizationId = this.resolveOrganizationId(user, id);
    const logo =
      dto.logo === undefined || dto.logo === null
        ? dto.logo
        : await this.storageService.resolveAssetUrl(dto.logo, {
            organizationId,
            entityType: 'ORG_LOGO',
          });
    const organization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: dto.name,
        slug: dto.slug,
        logo,
        website: dto.website,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        timezone: dto.timezone,
        currency: dto.currency,
        language: dto.language,
        isActive: dto.isActive,
      },
      include: { _count: { select: { members: true, courses: true, batches: true } } },
    });
    await this.writeAudit(user.id, 'admin.organization.update', 'Organization', id, {});
    return { message: 'Organization updated successfully.', data: organization };
  }

  async updateTeacherProfile(
    user: AuthenticatedUser,
    profileId: string,
    dto: UpdateTeacherProfileDto,
  ): Promise<AdminPayload> {
    const organizationId = this.resolveOrganizationId(user, dto.organizationId);
    const profile = await this.prisma.teacherProfile.findFirst({
      where: { id: profileId, organizationId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException('Teacher profile not found.');
    }
    const updated = await this.prisma.teacherProfile.update({
      where: { id: profileId },
      data: {
        bio: dto.bio,
        qualifications: dto.qualifications,
        specializations: dto.specializations,
        experienceYears: dto.experienceYears,
      },
    });
    await this.writeAudit(user.id, 'admin.teacher.update', 'TeacherProfile', profileId, {
      organizationId,
    });
    return { message: 'Teacher profile updated successfully.', data: updated };
  }

  async auditLogs(user: AuthenticatedUser, query: AdminAuditQueryDto): Promise<AdminPayload> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    const where = {
      user: { organizationMembers: { some: { organizationId } } },
      ...(query.action ? { action: { contains: query.action, mode: 'insensitive' as const } } : {}),
      ...(query.entity ? { entity: { contains: query.entity, mode: 'insensitive' as const } } : {}),
      ...(query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: 'insensitive' as const } },
              { entity: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);
    return {
      message: 'Audit logs retrieved successfully.',
      data: { items, meta: this.pageMeta(total, query.page, query.limit) },
    };
  }

  private resolveOrganizationId(user: AuthenticatedUser, requested?: string): string {
    const organizationId = requested ?? user.organizationIds[0];
    if (!organizationId || !user.organizationIds.includes(organizationId)) {
      throw new ForbiddenException('Organization access denied.');
    }
    return organizationId;
  }

  private async requireMember(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: {
        user: {
          include: {
            userRoles: { include: { role: true } },
            teacherProfiles: { where: { organizationId, deletedAt: null }, take: 1 },
            studentProfiles: { where: { organizationId, deletedAt: null }, take: 1 },
          },
        },
      },
    });
    if (!member || member.user.deletedAt) {
      throw new NotFoundException('User not found in this organization.');
    }
    return member;
  }

  private mapMember(member: Awaited<ReturnType<AdminService['requireMember']>>) {
    const { user } = member;
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      membership: { id: member.id, status: member.status, joinedAt: member.joinedAt },
      roles: user.userRoles.map(({ role }) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      })),
      teacherProfile: user.teacherProfiles[0] ?? null,
      studentProfile: user.studentProfiles[0] ?? null,
    };
  }

  private pageMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  private async writeAudit(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    metadata: AuditMetadata,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, metadata },
    });
  }
}
