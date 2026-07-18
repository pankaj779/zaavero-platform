import { Inject, Injectable } from '@nestjs/common';
import { buildPageMeta } from '../../../common/pagination';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { CALENDAR_REPOSITORY } from '../constants/injection-tokens';
import type {
  CalendarEventResponseDto,
  PaginatedCalendarEventsResponseDto,
} from '../dto/calendar-response.dto';
import type { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import type { ListCalendarEventsQueryDto } from '../dto/list-calendar-events-query.dto';
import type { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import {
  AssignmentNotFoundException,
  BatchNotFoundException,
  CalendarEventForbiddenException,
  CalendarEventNotFoundException,
  CourseNotFoundException,
  InvalidCalendarEventException,
  LiveSessionNotFoundException,
  OrganizationAccessDeniedException,
  StudentProfileNotFoundException,
  TeacherCalendarMutationForbiddenException,
} from '../exceptions';
import type {
  BatchContextRecord,
  CalendarEventRecord,
  CalendarRepository,
  CourseContextRecord,
} from '../interfaces/calendar-repository.interface';
import { CalendarMapper } from '../mappers/calendar.mapper';

interface ResolvedCalendarLinks {
  courseId: string | null;
  batchId: string | null;
  liveSessionId: string | null;
  assignmentId: string | null;
  courseContext: CourseContextRecord | null;
  batchContext: BatchContextRecord | null;
}

@Injectable()
export class CalendarService {
  constructor(
    @Inject(CALENDAR_REPOSITORY)
    private readonly calendarRepository: CalendarRepository,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListCalendarEventsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedCalendarEventsResponseDto>> {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);

    let enrolledStudentId: string | undefined;
    if (this.isStudentOnly(user)) {
      enrolledStudentId = await this.requireOwnStudentProfile(organizationId, user.id);
    }

    const result = await this.calendarRepository.findMany({
      organizationId,
      courseId: query.courseId,
      batchId: query.batchId,
      liveSessionId: query.liveSessionId,
      assignmentId: query.assignmentId,
      enrolledStudentId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      message: 'Calendar events retrieved successfully.',
      data: {
        items: CalendarMapper.toResponseList(result.items),
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
  ): Promise<ControllerSuccessPayload<CalendarEventResponseDto>> {
    const event = await this.requireAccessibleEvent(user, id);

    return {
      message: 'Calendar event retrieved successfully.',
      data: CalendarMapper.toResponse(event),
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateCalendarEventDto,
  ): Promise<ControllerSuccessPayload<CalendarEventResponseDto>> {
    this.assertOrganizationAccess(user, dto.organizationId);

    const startsAt = new Date(dto.startsAt);
    const endsAt =
      dto.endsAt === undefined ? undefined : dto.endsAt === null ? null : new Date(dto.endsAt);

    this.assertValidSchedule(startsAt, endsAt ?? null);

    const links = await this.resolveAndValidateLinks(dto.organizationId, {
      courseId: dto.courseId ?? null,
      batchId: dto.batchId ?? null,
      liveSessionId: dto.liveSessionId ?? null,
      assignmentId: dto.assignmentId ?? null,
    });

    await this.assertCanMutateEvent(user, dto.organizationId, links);

    const event = await this.calendarRepository.create({
      organizationId: dto.organizationId,
      courseId: links.courseId,
      batchId: links.batchId,
      liveSessionId: links.liveSessionId,
      assignmentId: links.assignmentId,
      title: dto.title,
      description: dto.description ?? null,
      startsAt,
      endsAt: endsAt ?? null,
      allDay: dto.allDay,
      externalProvider: dto.externalProvider,
      externalEventId: dto.externalEventId ?? null,
    });

    return {
      message: 'Calendar event created successfully.',
      data: CalendarMapper.toResponse(event),
    };
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateCalendarEventDto,
  ): Promise<ControllerSuccessPayload<CalendarEventResponseDto>> {
    const existing = await this.requireAccessibleEvent(user, id);

    const mergedLinks = {
      courseId: dto.courseId !== undefined ? dto.courseId : existing.courseId,
      batchId: dto.batchId !== undefined ? dto.batchId : existing.batchId,
      liveSessionId: dto.liveSessionId !== undefined ? dto.liveSessionId : existing.liveSessionId,
      assignmentId: dto.assignmentId !== undefined ? dto.assignmentId : existing.assignmentId,
    };

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt =
      dto.endsAt !== undefined
        ? dto.endsAt === null
          ? null
          : new Date(dto.endsAt)
        : existing.endsAt;

    this.assertValidSchedule(startsAt, endsAt);

    const links = await this.resolveAndValidateLinks(existing.organizationId, mergedLinks);

    await this.assertCanMutateEvent(user, existing.organizationId, links, existing);

    const updated = await this.calendarRepository.update(id, {
      courseId: links.courseId,
      batchId: links.batchId,
      liveSessionId: links.liveSessionId,
      assignmentId: links.assignmentId,
      title: dto.title,
      description: dto.description,
      startsAt: dto.startsAt ? startsAt : undefined,
      endsAt: dto.endsAt !== undefined ? endsAt : undefined,
      allDay: dto.allDay,
      externalProvider: dto.externalProvider,
      externalEventId: dto.externalEventId,
    });

    return {
      message: 'Calendar event updated successfully.',
      data: CalendarMapper.toResponse(updated),
    };
  }

  async softDelete(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ControllerSuccessPayload<CalendarEventResponseDto>> {
    const existing = await this.requireAccessibleEvent(user, id);

    const links = await this.resolveAndValidateLinks(existing.organizationId, {
      courseId: existing.courseId,
      batchId: existing.batchId,
      liveSessionId: existing.liveSessionId,
      assignmentId: existing.assignmentId,
    });

    await this.assertCanMutateEvent(user, existing.organizationId, links, existing);

    const deleted = await this.calendarRepository.softDelete(id);

    return {
      message: 'Calendar event deleted successfully.',
      data: CalendarMapper.toResponse(deleted),
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

  private assertValidSchedule(startsAt: Date, endsAt: Date | null): void {
    if (endsAt && endsAt <= startsAt) {
      throw new InvalidCalendarEventException('endsAt must be after startsAt.');
    }
  }

  private async resolveAndValidateLinks(
    organizationId: string,
    links: {
      courseId: string | null;
      batchId: string | null;
      liveSessionId: string | null;
      assignmentId: string | null;
    },
  ): Promise<ResolvedCalendarLinks> {
    let courseContext: CourseContextRecord | null = null;
    let batchContext: BatchContextRecord | null = null;

    if (links.courseId) {
      courseContext = await this.calendarRepository.findCourseContext(links.courseId);

      if (courseContext?.organizationId !== organizationId) {
        throw new CourseNotFoundException();
      }
    }

    if (links.batchId) {
      batchContext = await this.calendarRepository.findBatchContext(links.batchId);

      if (batchContext?.organizationId !== organizationId) {
        throw new BatchNotFoundException();
      }
    }

    if (links.courseId && links.batchId && batchContext?.courseId !== links.courseId) {
      throw new InvalidCalendarEventException('Batch does not belong to the specified course.');
    }

    if (links.liveSessionId) {
      const liveSession = await this.calendarRepository.findLiveSessionContext(links.liveSessionId);

      if (liveSession?.organizationId !== organizationId) {
        throw new LiveSessionNotFoundException();
      }
    }

    if (links.assignmentId) {
      const assignment = await this.calendarRepository.findAssignmentContext(links.assignmentId);

      if (assignment?.organizationId !== organizationId) {
        throw new AssignmentNotFoundException();
      }
    }

    return {
      courseId: links.courseId,
      batchId: links.batchId,
      liveSessionId: links.liveSessionId,
      assignmentId: links.assignmentId,
      courseContext,
      batchContext,
    };
  }

  private async assertCanMutateEvent(
    user: AuthenticatedUser,
    organizationId: string,
    links: ResolvedCalendarLinks,
    existing?: CalendarEventRecord,
  ): Promise<void> {
    if (user.roles.includes(AUTH_ROLES.admin)) {
      return;
    }

    if (!user.roles.includes(AUTH_ROLES.teacher)) {
      throw new TeacherCalendarMutationForbiddenException();
    }

    const ownTeacherProfileId = await this.calendarRepository.findTeacherProfileId(
      organizationId,
      user.id,
    );

    if (!ownTeacherProfileId) {
      throw new TeacherCalendarMutationForbiddenException();
    }

    if (links.batchContext) {
      if (ownTeacherProfileId !== links.batchContext.teacherId) {
        throw new TeacherCalendarMutationForbiddenException();
      }
      return;
    }

    if (links.courseContext) {
      if (ownTeacherProfileId !== links.courseContext.teacherId) {
        throw new TeacherCalendarMutationForbiddenException();
      }
      return;
    }

    if (existing?.batchId) {
      const batchContext = await this.calendarRepository.findBatchContext(existing.batchId);

      if (batchContext?.teacherId !== ownTeacherProfileId) {
        throw new TeacherCalendarMutationForbiddenException();
      }
      return;
    }

    if (existing?.courseId) {
      const courseContext = await this.calendarRepository.findCourseContext(existing.courseId);

      if (courseContext?.teacherId !== ownTeacherProfileId) {
        throw new TeacherCalendarMutationForbiddenException();
      }
      return;
    }

    const isTeacherInOrg = await this.calendarRepository.teacherExistsInOrganization(
      organizationId,
      user.id,
    );

    if (!isTeacherInOrg) {
      throw new TeacherCalendarMutationForbiddenException();
    }
  }

  private async requireAccessibleEvent(
    user: AuthenticatedUser,
    id: string,
  ): Promise<CalendarEventRecord> {
    const event = await this.calendarRepository.findById(id);

    if (!event) {
      throw new CalendarEventNotFoundException();
    }

    this.assertOrganizationAccess(user, event.organizationId);

    if (this.isStudentOnly(user)) {
      const ownStudentId = await this.requireOwnStudentProfile(event.organizationId, user.id);
      const hasAccess = await this.calendarRepository.studentHasAccessToEvent(
        event.id,
        ownStudentId,
      );
      if (!hasAccess) {
        throw new CalendarEventForbiddenException();
      }
    }

    return event;
  }

  private isStudentOnly(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes(AUTH_ROLES.student) &&
      !user.roles.includes(AUTH_ROLES.admin) &&
      !user.roles.includes(AUTH_ROLES.teacher)
    );
  }

  private async requireOwnStudentProfile(organizationId: string, userId: string): Promise<string> {
    const studentProfileId = await this.calendarRepository.findStudentProfileId(
      organizationId,
      userId,
    );

    if (!studentProfileId) {
      throw new StudentProfileNotFoundException();
    }

    return studentProfileId;
  }
}
