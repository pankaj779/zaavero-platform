import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  AssignmentContextRecord,
  BatchContextRecord,
  CalendarEventListFilters,
  CalendarEventListResult,
  CalendarEventRecord,
  CalendarRepository,
  CourseContextRecord,
  CreateCalendarEventData,
  LiveSessionContextRecord,
  UpdateCalendarEventData,
} from '../interfaces/calendar-repository.interface';

const calendarEventSelect = {
  id: true,
  organizationId: true,
  courseId: true,
  batchId: true,
  liveSessionId: true,
  assignmentId: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  allDay: true,
  externalProvider: true,
  externalEventId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class PrismaCalendarRepository implements CalendarRepository {
  public readonly marker = 'calendar-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<CalendarEventRecord | null> {
    return this.prisma.calendarEvent.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: calendarEventSelect,
    });
  }

  async findMany(filters: CalendarEventListFilters): Promise<CalendarEventListResult> {
    const where = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.batchId ? { batchId: filters.batchId } : {}),
      ...(filters.liveSessionId ? { liveSessionId: filters.liveSessionId } : {}),
      ...(filters.assignmentId ? { assignmentId: filters.assignmentId } : {}),
      ...(filters.from || filters.to
        ? {
            startsAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            title: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(filters.enrolledStudentId
        ? { AND: [this.studentVisibilityWhere(filters.enrolledStudentId)] }
        : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.calendarEvent.findMany({
        where,
        select: calendarEventSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.calendarEvent.count({ where }),
    ]);

    return { items, total };
  }

  async findCourseContext(courseId: string): Promise<CourseContextRecord | null> {
    return this.prisma.course.findFirst({
      where: {
        id: courseId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
        teacherId: true,
      },
    });
  }

  async findBatchContext(batchId: string): Promise<BatchContextRecord | null> {
    return this.prisma.batch.findFirst({
      where: {
        id: batchId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
        courseId: true,
        teacherId: true,
      },
    });
  }

  async findLiveSessionContext(liveSessionId: string): Promise<LiveSessionContextRecord | null> {
    return this.prisma.liveSession.findFirst({
      where: {
        id: liveSessionId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });
  }

  async findAssignmentContext(assignmentId: string): Promise<AssignmentContextRecord | null> {
    return this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });
  }

  async findTeacherProfileId(organizationId: string, userId: string): Promise<string | null> {
    const profile = await this.prisma.teacherProfile.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return profile?.id ?? null;
  }

  async teacherExistsInOrganization(organizationId: string, userId: string): Promise<boolean> {
    const profile = await this.prisma.teacherProfile.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return profile !== null;
  }

  async findStudentProfileId(organizationId: string, userId: string): Promise<string | null> {
    const profile = await this.prisma.studentProfile.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return profile?.id ?? null;
  }

  async studentHasAccessToEvent(eventId: string, studentProfileId: string): Promise<boolean> {
    const event = await this.prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
        AND: [this.studentVisibilityWhere(studentProfileId)],
      },
      select: { id: true },
    });

    return event !== null;
  }

  /**
   * Students only see events tied to their non-dropped enrollments. The schema
   * has no explicit organization-wide audience marker, so events without any
   * course/batch/liveSession/assignment link stay hidden from students.
   */
  private studentVisibilityWhere(studentProfileId: string) {
    const ownEnrollment = {
      some: {
        studentId: studentProfileId,
        NOT: { status: 'DROPPED' as const },
      },
    };

    return {
      OR: [
        { course: { deletedAt: null, enrollments: ownEnrollment } },
        { batch: { deletedAt: null, enrollments: ownEnrollment } },
        {
          liveSession: {
            deletedAt: null,
            batch: { deletedAt: null, enrollments: ownEnrollment },
          },
        },
        {
          assignment: {
            deletedAt: null,
            status: { in: ['PUBLISHED' as const, 'CLOSED' as const] },
            OR: [
              {
                batchId: null,
                course: { deletedAt: null, enrollments: ownEnrollment },
              },
              { batch: { deletedAt: null, enrollments: ownEnrollment } },
            ],
          },
        },
      ],
    };
  }

  async create(data: CreateCalendarEventData): Promise<CalendarEventRecord> {
    return this.prisma.calendarEvent.create({
      data: {
        organizationId: data.organizationId,
        courseId: data.courseId ?? null,
        batchId: data.batchId ?? null,
        liveSessionId: data.liveSessionId ?? null,
        assignmentId: data.assignmentId ?? null,
        title: data.title,
        description: data.description ?? null,
        startsAt: data.startsAt,
        endsAt: data.endsAt ?? null,
        allDay: data.allDay ?? false,
        externalProvider: data.externalProvider ?? 'NONE',
        externalEventId: data.externalEventId ?? null,
      },
      select: calendarEventSelect,
    });
  }

  async update(id: string, data: UpdateCalendarEventData): Promise<CalendarEventRecord> {
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(data.courseId !== undefined ? { courseId: data.courseId } : {}),
        ...(data.batchId !== undefined ? { batchId: data.batchId } : {}),
        ...(data.liveSessionId !== undefined ? { liveSessionId: data.liveSessionId } : {}),
        ...(data.assignmentId !== undefined ? { assignmentId: data.assignmentId } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.startsAt !== undefined ? { startsAt: data.startsAt } : {}),
        ...(data.endsAt !== undefined ? { endsAt: data.endsAt } : {}),
        ...(data.allDay !== undefined ? { allDay: data.allDay } : {}),
        ...(data.externalProvider !== undefined ? { externalProvider: data.externalProvider } : {}),
        ...(data.externalEventId !== undefined ? { externalEventId: data.externalEventId } : {}),
      },
      select: calendarEventSelect,
    });
  }

  async softDelete(id: string): Promise<CalendarEventRecord> {
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: calendarEventSelect,
    });
  }
}
