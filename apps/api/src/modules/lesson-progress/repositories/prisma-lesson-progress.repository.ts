import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  CreateLessonProgressData,
  LessonProgressListFilters,
  LessonProgressListResult,
  LessonProgressRecord,
  LessonProgressRepository,
  UpdateLessonProgressData,
} from '../interfaces/lesson-progress-repository.interface';

const select = {
  id: true,
  organizationId: true,
  lessonId: true,
  studentId: true,
  status: true,
  progressPercent: true,
  lastPositionSeconds: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaLessonProgressRepository implements LessonProgressRepository {
  public readonly marker = 'lesson-progress-repository' as const;
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<LessonProgressRecord | null> {
    return this.prisma.lessonProgress.findFirst({ where: { id }, select });
  }

  async findMany(filters: LessonProgressListFilters): Promise<LessonProgressListResult> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.lessonId ? { lessonId: filters.lessonId } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const skip = (filters.page - 1) * filters.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lessonProgress.findMany({
        where,
        select,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.lessonProgress.count({ where }),
    ]);
    return { items, total };
  }

  async findByLessonAndStudent(
    lessonId: string,
    studentId: string,
  ): Promise<LessonProgressRecord | null> {
    return this.prisma.lessonProgress.findFirst({ where: { lessonId, studentId }, select });
  }

  async lessonExistsInOrganization(organizationId: string, lessonId: string) {
    const row = await this.prisma.lesson.findFirst({
      where: { id: lessonId, organizationId, deletedAt: null },
      select: { id: true },
    });
    return row !== null;
  }

  async studentProfileExistsInOrganization(organizationId: string, studentProfileId: string) {
    const row = await this.prisma.studentProfile.findFirst({
      where: { id: studentProfileId, organizationId, deletedAt: null },
      select: { id: true },
    });
    return row !== null;
  }

  async findStudentProfileId(organizationId: string, userId: string) {
    const row = await this.prisma.studentProfile.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async create(data: CreateLessonProgressData): Promise<LessonProgressRecord> {
    return this.prisma.lessonProgress.create({
      data: {
        organizationId: data.organizationId,
        lessonId: data.lessonId,
        studentId: data.studentId,
        status: data.status,
        progressPercent: data.progressPercent,
        lastPositionSeconds: data.lastPositionSeconds,
        completedAt: data.completedAt,
      },
      select,
    });
  }

  async update(id: string, data: UpdateLessonProgressData): Promise<LessonProgressRecord> {
    return this.prisma.lessonProgress.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.progressPercent !== undefined ? { progressPercent: data.progressPercent } : {}),
        ...(data.lastPositionSeconds !== undefined
          ? { lastPositionSeconds: data.lastPositionSeconds }
          : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
      },
      select,
    });
  }
}
