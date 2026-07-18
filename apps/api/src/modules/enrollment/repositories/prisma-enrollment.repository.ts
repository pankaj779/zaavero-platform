import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  BatchContextRecord,
  CreateEnrollmentData,
  EnrollmentListFilters,
  EnrollmentListResult,
  EnrollmentRecord,
  EnrollmentRepository,
  UpdateEnrollmentData,
} from '../interfaces/enrollment-repository.interface';

const enrollmentSelect = {
  id: true,
  organizationId: true,
  courseId: true,
  batchId: true,
  studentId: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaEnrollmentRepository implements EnrollmentRepository {
  public readonly marker = 'enrollment-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<EnrollmentRecord | null> {
    return this.prisma.enrollment.findFirst({
      where: {
        id,
        NOT: { status: 'DROPPED' },
      },
      select: enrollmentSelect,
    });
  }

  async findMany(filters: EnrollmentListFilters): Promise<EnrollmentListResult> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.batchId ? { batchId: filters.batchId } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(!filters.status || filters.excludeDropped ? { NOT: { status: 'DROPPED' as const } } : {}),
      ...(filters.search
        ? {
            student: {
              deletedAt: null,
              user: {
                OR: [
                  {
                    email: {
                      contains: filters.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    firstName: {
                      contains: filters.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    lastName: {
                      contains: filters.search,
                      mode: 'insensitive' as const,
                    },
                  },
                ],
              },
            },
          }
        : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        select: enrollmentSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return { items, total };
  }

  async findByBatchAndStudent(
    batchId: string,
    studentId: string,
  ): Promise<EnrollmentRecord | null> {
    return this.prisma.enrollment.findFirst({
      where: {
        batchId,
        studentId,
      },
      select: enrollmentSelect,
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

  async courseExistsInOrganization(organizationId: string, courseId: string): Promise<boolean> {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return course !== null;
  }

  async studentProfileExistsInOrganization(
    organizationId: string,
    studentProfileId: string,
  ): Promise<boolean> {
    const profile = await this.prisma.studentProfile.findFirst({
      where: {
        id: studentProfileId,
        organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return profile !== null;
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

  async create(data: CreateEnrollmentData): Promise<EnrollmentRecord> {
    return this.prisma.enrollment.create({
      data: {
        organizationId: data.organizationId,
        courseId: data.courseId,
        batchId: data.batchId,
        studentId: data.studentId,
        status: data.status,
      },
      select: enrollmentSelect,
    });
  }

  async update(id: string, data: UpdateEnrollmentData): Promise<EnrollmentRecord> {
    return this.prisma.enrollment.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
      },
      select: enrollmentSelect,
    });
  }

  async softDelete(id: string): Promise<EnrollmentRecord> {
    return this.prisma.enrollment.update({
      where: { id },
      data: {
        status: 'DROPPED',
        completedAt: null,
      },
      select: enrollmentSelect,
    });
  }
}
