import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  AssignmentListFilters,
  AssignmentListResult,
  AssignmentRecord,
  AssignmentRepository,
  BatchContextRecord,
  CourseContextRecord,
  CreateAssignmentData,
  UpdateAssignmentData,
} from '../interfaces/assignment-repository.interface';

const assignmentSelect = {
  id: true,
  organizationId: true,
  courseId: true,
  batchId: true,
  title: true,
  instructions: true,
  attachmentUrls: true,
  status: true,
  maxScore: true,
  dueAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class PrismaAssignmentRepository implements AssignmentRepository {
  public readonly marker = 'assignment-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<AssignmentRecord | null> {
    return this.prisma.assignment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: assignmentSelect,
    });
  }

  async findMany(filters: AssignmentListFilters): Promise<AssignmentListResult> {
    const where = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.batchId ? { batchId: filters.batchId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
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
      this.prisma.assignment.findMany({
        where,
        select: assignmentSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.assignment.count({ where }),
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

  async studentHasAccessToAssignment(
    assignmentId: string,
    studentProfileId: string,
  ): Promise<boolean> {
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        deletedAt: null,
        AND: [this.studentVisibilityWhere(studentProfileId)],
      },
      select: { id: true },
    });

    return assignment !== null;
  }

  /**
   * Students only see PUBLISHED/CLOSED assignments; course-wide assignments
   * require a course enrollment while batch-specific ones require enrollment
   * in that exact batch.
   */
  private studentVisibilityWhere(studentProfileId: string) {
    const ownEnrollment = {
      some: {
        studentId: studentProfileId,
        NOT: { status: 'DROPPED' as const },
      },
    };

    return {
      status: { in: ['PUBLISHED' as const, 'CLOSED' as const] },
      OR: [
        {
          batchId: null,
          course: { deletedAt: null, enrollments: ownEnrollment },
        },
        {
          batch: { deletedAt: null, enrollments: ownEnrollment },
        },
      ],
    };
  }

  async create(data: CreateAssignmentData): Promise<AssignmentRecord> {
    return this.prisma.assignment.create({
      data: {
        organizationId: data.organizationId,
        courseId: data.courseId,
        batchId: data.batchId ?? null,
        title: data.title,
        instructions: data.instructions ?? null,
        attachmentUrls: data.attachmentUrls ?? [],
        status: data.status,
        maxScore: data.maxScore ?? null,
        dueAt: data.dueAt ?? null,
      },
      select: assignmentSelect,
    });
  }

  async update(id: string, data: UpdateAssignmentData): Promise<AssignmentRecord> {
    return this.prisma.assignment.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
        ...(data.attachmentUrls !== undefined ? { attachmentUrls: data.attachmentUrls } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.maxScore !== undefined ? { maxScore: data.maxScore } : {}),
        ...(data.dueAt !== undefined ? { dueAt: data.dueAt } : {}),
        ...(data.batchId !== undefined ? { batchId: data.batchId } : {}),
      },
      select: assignmentSelect,
    });
  }

  async softDelete(id: string): Promise<AssignmentRecord> {
    return this.prisma.assignment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: assignmentSelect,
    });
  }
}
