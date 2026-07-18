import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  BatchListFilters,
  BatchListResult,
  BatchRecord,
  BatchRepository,
  CreateBatchData,
  UpdateBatchData,
} from '../interfaces/batch-repository.interface';

const batchSelect = {
  id: true,
  organizationId: true,
  courseId: true,
  teacherId: true,
  name: true,
  status: true,
  startDate: true,
  endDate: true,
  maxStudents: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class PrismaBatchRepository implements BatchRepository {
  public readonly marker = 'batch-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<BatchRecord | null> {
    return this.prisma.batch.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: batchSelect,
    });
  }

  async findMany(filters: BatchListFilters): Promise<BatchListResult> {
    const where = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters.enrolledStudentId
        ? {
            enrollments: {
              some: {
                studentId: filters.enrolledStudentId,
                NOT: { status: 'DROPPED' as const },
              },
            },
          }
        : {}),
      ...(filters.search
        ? {
            name: { contains: filters.search, mode: 'insensitive' as const },
          }
        : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.batch.findMany({
        where,
        select: batchSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.batch.count({ where }),
    ]);

    return { items, total };
  }

  async findByCourseName(courseId: string, name: string): Promise<BatchRecord | null> {
    return this.prisma.batch.findFirst({
      where: {
        courseId,
        name,
        deletedAt: null,
      },
      select: batchSelect,
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

  async teacherProfileExistsInOrganization(
    organizationId: string,
    teacherProfileId: string,
  ): Promise<boolean> {
    const profile = await this.prisma.teacherProfile.findFirst({
      where: {
        id: teacherProfileId,
        organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return profile !== null;
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

  async isStudentEnrolledInBatch(batchId: string, studentProfileId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        batchId,
        studentId: studentProfileId,
        NOT: { status: 'DROPPED' },
      },
      select: { id: true },
    });

    return enrollment !== null;
  }

  async create(data: CreateBatchData): Promise<BatchRecord> {
    return this.prisma.batch.create({
      data: {
        organizationId: data.organizationId,
        courseId: data.courseId,
        teacherId: data.teacherId,
        name: data.name,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        maxStudents: data.maxStudents,
      },
      select: batchSelect,
    });
  }

  async update(id: string, data: UpdateBatchData): Promise<BatchRecord> {
    return this.prisma.batch.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.maxStudents !== undefined ? { maxStudents: data.maxStudents } : {}),
        ...(data.teacherId !== undefined ? { teacherId: data.teacherId } : {}),
      },
      select: batchSelect,
    });
  }

  async softDelete(id: string): Promise<BatchRecord> {
    return this.prisma.batch.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: batchSelect,
    });
  }
}
