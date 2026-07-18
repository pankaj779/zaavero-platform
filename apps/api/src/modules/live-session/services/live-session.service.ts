import { Inject, Injectable } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { BusinessEmailService } from '../../email/services/business-email.service';
import { LIVE_SESSION_REPOSITORY } from '../constants/injection-tokens';
import type { CreateLiveSessionDto } from '../dto/create-live-session.dto';
import type { ListLiveSessionsQueryDto } from '../dto/list-live-sessions-query.dto';
import type {
  LiveSessionResponseDto,
  PaginatedLiveSessionsResponseDto,
} from '../dto/live-session-response.dto';
import type { UpdateLiveSessionDto } from '../dto/update-live-session.dto';
import {
  BatchNotFoundException,
  InvalidLiveSessionException,
  LiveSessionForbiddenException,
  LiveSessionNotFoundException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherLiveSessionMutationForbiddenException,
} from '../exceptions';
import type {
  BatchContextRecord,
  LiveSessionRecord,
  LiveSessionRepository,
} from '../interfaces/live-session-repository.interface';
import { LiveSessionMapper } from '../mappers/live-session.mapper';

@Injectable()
export class LiveSessionService {
  constructor(
    @Inject(LIVE_SESSION_REPOSITORY) private readonly repo: LiveSessionRepository,
    private readonly businessEmail?: BusinessEmailService,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListLiveSessionsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedLiveSessionsResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    let enrolledStudentId: string | undefined;
    if (this.isStudentOnly(user)) {
      enrolledStudentId = await this.requireOwnStudentProfile(organizationId, user.id);
    }
    const result = await this.repo.findMany({
      organizationId,
      batchId: query.batchId,
      status: query.status,
      meetingProvider: query.meetingProvider,
      search: query.search,
      enrolledStudentId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return {
      message: 'Live sessions retrieved successfully.',
      data: {
        items: LiveSessionMapper.toResponseList(result.items),
        meta: buildPageMeta({ total: result.total, page: query.page, limit: query.limit }),
      },
    };
  }

  async getById(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<LiveSessionResponseDto>> {
    const row = await this.requireAccessible(user, id);
    return {
      message: 'Live session retrieved successfully.',
      data: LiveSessionMapper.toResponse(row),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateLiveSessionDto,
  ): Promise<ControllerSuccessPayload<LiveSessionResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);
    const batch = await this.requireBatch(dto.organizationId, dto.batchId);
    await this.assertCanMutate(user, batch);
    this.assertSchedule(dto.startsAt, dto.endsAt);
    const created = await this.repo.create({
      organizationId: dto.organizationId,
      batchId: dto.batchId,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      meetingProvider: dto.meetingProvider,
      meetingUrl: dto.meetingUrl,
      recordingUrl: dto.recordingUrl,
      startsAt: new Date(dto.startsAt),
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
    });
    if (created.status === 'SCHEDULED') {
      await this.businessEmail?.liveSessionCreated(created.id);
    }
    return {
      message: 'Live session created successfully.',
      data: LiveSessionMapper.toResponse(created),
    };
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateLiveSessionDto,
  ): Promise<ControllerSuccessPayload<LiveSessionResponseDto>> {
    const row = await this.requireAccessible(user, id);
    const batch = await this.requireBatch(row.organizationId, row.batchId);
    await this.assertCanMutate(user, batch);
    const startsAt = dto.startsAt ?? row.startsAt.toISOString();
    const endsAt =
      dto.endsAt === undefined
        ? row.endsAt
          ? row.endsAt.toISOString()
          : undefined
        : (dto.endsAt ?? undefined);
    this.assertSchedule(startsAt, endsAt ?? undefined);
    const updated = await this.repo.update(id, {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      meetingProvider: dto.meetingProvider,
      meetingUrl: dto.meetingUrl,
      recordingUrl: dto.recordingUrl,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt:
        dto.endsAt === undefined ? undefined : dto.endsAt === null ? null : new Date(dto.endsAt),
    });
    if (row.status !== 'CANCELLED' && updated.status === 'CANCELLED') {
      await this.businessEmail?.liveSessionCancelled(updated.id);
    }
    return {
      message: 'Live session updated successfully.',
      data: LiveSessionMapper.toResponse(updated),
    };
  }

  async softDelete(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<LiveSessionResponseDto>> {
    const row = await this.requireAccessible(user, id);
    const batch = await this.requireBatch(row.organizationId, row.batchId);
    await this.assertCanMutate(user, batch);
    const deleted = await this.repo.softDelete(id);
    return {
      message: 'Live session deleted successfully.',
      data: LiveSessionMapper.toResponse(deleted),
    };
  }

  private assertSchedule(startsAt: string, endsAt?: string) {
    if (endsAt && new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
      throw new InvalidLiveSessionException('startsAt must be before endsAt.');
    }
  }

  private async requireBatch(organizationId: string, batchId: string): Promise<BatchContextRecord> {
    const batch = await this.repo.findBatchContext(batchId);
    if (batch?.organizationId !== organizationId) throw new BatchNotFoundException();
    return batch;
  }

  private async assertCanMutate(user: AuthenticatedUser, batch: BatchContextRecord) {
    if (user.roles.includes(AUTH_ROLES.admin)) return;
    const own = await this.repo.findTeacherProfileId(batch.organizationId, user.id);
    if (!own || own !== batch.teacherId) throw new TeacherLiveSessionMutationForbiddenException();
  }

  private async requireAccessible(user: AuthenticatedUser, id: string): Promise<LiveSessionRecord> {
    const row = await this.repo.findById(id);
    if (!row) throw new LiveSessionNotFoundException();
    this.assertOrganizationAccess(user, row.organizationId);
    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.requireOwnStudentProfile(row.organizationId, user.id);
      const enrolled = await this.repo.isStudentEnrolledInBatch(row.batchId, ownStudentId);
      if (!enrolled) throw new LiveSessionForbiddenException();
    }
    return row;
  }

  private isStudentOnly(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes(AUTH_ROLES.student) &&
      !user.roles.includes(AUTH_ROLES.admin) &&
      !user.roles.includes(AUTH_ROLES.teacher)
    );
  }

  private async requireOwnStudentProfile(organizationId: string, userId: string): Promise<string> {
    const studentProfileId = await this.repo.findStudentProfileId(organizationId, userId);
    if (!studentProfileId) throw new StudentProfileNotFoundException();
    return studentProfileId;
  }

  private resolveOrganizationId(user: AuthenticatedUser, organizationId?: string) {
    if (organizationId) {
      this.assertOrganizationAccess(user, organizationId);
      return organizationId;
    }
    if (user.organizationIds.length === 1) {
      const [only] = user.organizationIds;
      if (only) return only;
    }
    throw new OrganizationAccessDeniedException(
      'organizationId is required when you belong to multiple organizations.',
    );
  }

  private assertOrganizationAccess(user: AuthenticatedUser, organizationId: string) {
    if (!user.organizationIds.includes(organizationId))
      throw new OrganizationAccessDeniedException();
  }
}
