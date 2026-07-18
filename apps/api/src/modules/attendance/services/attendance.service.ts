import { Inject, Injectable } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { ATTENDANCE_REPOSITORY } from '../constants/injection-tokens';
import type {
  AttendanceResponseDto,
  PaginatedAttendancesResponseDto,
} from '../dto/attendance-response.dto';
import type { CreateAttendanceDto } from '../dto/create-attendance.dto';
import type { ListAttendancesQueryDto } from '../dto/list-attendances-query.dto';
import type { UpdateAttendanceDto } from '../dto/update-attendance.dto';
import {
  AttendanceConflictException,
  AttendanceForbiddenException,
  AttendanceNotFoundException,
  LiveSessionNotFoundException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherAttendanceMutationForbiddenException,
} from '../exceptions';
import type {
  AttendanceRecord,
  AttendanceRepository,
  LiveSessionContextRecord,
} from '../interfaces/attendance-repository.interface';
import { AttendanceMapper } from '../mappers/attendance.mapper';

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(ATTENDANCE_REPOSITORY)
    private readonly attendanceRepository: AttendanceRepository,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListAttendancesQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedAttendancesResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);

    let studentId = query.studentId;
    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.requireOwnStudentProfile(organizationId, user.id);
      if (query.studentId && query.studentId !== ownStudentId) {
        throw new AttendanceForbiddenException();
      }
      studentId = ownStudentId;
    }

    const result = await this.attendanceRepository.findMany({
      organizationId,
      liveSessionId: query.liveSessionId,
      studentId,
      status: query.status,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Attendances retrieved successfully.',
      data: {
        items: AttendanceMapper.toResponseList(result.items),
        meta: buildPageMeta({
          total: result.total,
          page: query.page,
          limit: query.limit,
        }),
      },
    };
  }

  async getById(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<AttendanceResponseDto>> {
    const attendance = await this.requireAccessibleAttendance(user, id);

    return {
      message: 'Attendance retrieved successfully.',
      data: AttendanceMapper.toResponse(attendance),
    };
  }

  async mark(
    user: AuthenticatedUser,
    dto: CreateAttendanceDto,
  ): Promise<ControllerSuccessPayload<AttendanceResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);

    const liveSession = await this.requireLiveSessionInOrganization(
      dto.organizationId,
      dto.liveSessionId,
    );
    await this.assertCanMutateLiveSessionAttendance(user, liveSession);

    const studentExists = await this.attendanceRepository.studentProfileExistsInOrganization(
      dto.organizationId,
      dto.studentId,
    );
    if (!studentExists) {
      throw new StudentProfileNotFoundException();
    }

    const existing = await this.attendanceRepository.findByLiveSessionAndStudent(
      dto.liveSessionId,
      dto.studentId,
    );
    if (existing) {
      throw new AttendanceConflictException();
    }

    try {
      const attendance = await this.attendanceRepository.create({
        organizationId: dto.organizationId,
        liveSessionId: dto.liveSessionId,
        studentId: dto.studentId,
        status: dto.status,
        markedAt: dto.markedAt ? new Date(dto.markedAt) : new Date(),
        notes: dto.notes,
      });

      return {
        message: 'Attendance marked successfully.',
        data: AttendanceMapper.toResponse(attendance),
      };
    } catch (error: unknown) {
      this.rethrowConflict(error);
      throw error;
    }
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateAttendanceDto,
  ): Promise<ControllerSuccessPayload<AttendanceResponseDto>> {
    const attendance = await this.requireAccessibleAttendance(user, id);
    const liveSession = await this.requireLiveSessionInOrganization(
      attendance.organizationId,
      attendance.liveSessionId,
    );
    await this.assertCanMutateLiveSessionAttendance(user, liveSession);

    const markedAt =
      dto.markedAt === undefined
        ? undefined
        : dto.markedAt === null
          ? null
          : new Date(dto.markedAt);

    const updated = await this.attendanceRepository.update(id, {
      status: dto.status,
      markedAt,
      notes: dto.notes,
    });

    return {
      message: 'Attendance updated successfully.',
      data: AttendanceMapper.toResponse(updated),
    };
  }

  private resolveOrganizationId(user: AuthenticatedUser, organizationId?: string): string {
    if (organizationId) {
      this.assertOrganizationAccess(user, organizationId);
      return organizationId;
    }

    if (user.organizationIds.length === 1) {
      const [onlyOrganizationId] = user.organizationIds;
      if (onlyOrganizationId) {
        return onlyOrganizationId;
      }
    }

    throw new OrganizationAccessDeniedException(
      'organizationId is required when you belong to multiple organizations.',
    );
  }

  private assertOrganizationAccess(user: AuthenticatedUser, organizationId: string): void {
    if (!user.organizationIds.includes(organizationId)) {
      throw new OrganizationAccessDeniedException();
    }
  }

  private async requireAccessibleAttendance(
    user: AuthenticatedUser,
    id: string,
  ): Promise<AttendanceRecord> {
    const attendance = await this.attendanceRepository.findById(id);

    if (!attendance) {
      throw new AttendanceNotFoundException();
    }

    this.assertOrganizationAccess(user, attendance.organizationId);

    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.requireOwnStudentProfile(attendance.organizationId, user.id);
      if (ownStudentId !== attendance.studentId) {
        throw new AttendanceForbiddenException();
      }
    }

    return attendance;
  }

  private isStudentOnly(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes(AUTH_ROLES.student) &&
      !user.roles.includes(AUTH_ROLES.admin) &&
      !user.roles.includes(AUTH_ROLES.teacher)
    );
  }

  private async requireOwnStudentProfile(organizationId: string, userId: string): Promise<string> {
    const studentProfileId = await this.attendanceRepository.findStudentProfileId(
      organizationId,
      userId,
    );

    if (!studentProfileId) {
      throw new StudentProfileNotFoundException();
    }

    return studentProfileId;
  }

  private async requireLiveSessionInOrganization(
    organizationId: string,
    liveSessionId: string,
  ): Promise<LiveSessionContextRecord> {
    const liveSession = await this.attendanceRepository.findLiveSessionContext(liveSessionId);

    if (liveSession?.organizationId !== organizationId) {
      throw new LiveSessionNotFoundException();
    }

    return liveSession;
  }

  private async assertCanMutateLiveSessionAttendance(
    user: AuthenticatedUser,
    liveSession: LiveSessionContextRecord,
  ): Promise<void> {
    if (user.roles.includes(AUTH_ROLES.admin)) {
      return;
    }

    const ownProfileId = await this.attendanceRepository.findTeacherProfileId(
      liveSession.organizationId,
      user.id,
    );

    if (!ownProfileId || ownProfileId !== liveSession.batchTeacherId) {
      throw new TeacherAttendanceMutationForbiddenException();
    }
  }

  private rethrowConflict(error: unknown): void {
    if (isPrismaUniqueConflict(error)) {
      throw new AttendanceConflictException();
    }
  }
}
