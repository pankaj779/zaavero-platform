import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  CreateLessonData,
  LessonListFilters,
  LessonListResult,
  LessonRecord,
  LessonRepository,
  ModuleContextRecord,
  UpdateLessonData,
} from '../interfaces/lesson-repository.interface';

const lessonSelect = {
  id: true,
  organizationId: true,
  moduleId: true,
  title: true,
  description: true,
  contentType: true,
  contentUrl: true,
  durationSeconds: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaLessonRepository implements LessonRepository {
  public readonly marker = 'lesson-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<LessonRecord | null> {
    return this.prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      select: lessonSelect,
    });
  }

  async findMany(filters: LessonListFilters): Promise<LessonListResult> {
    const moduleFilter = {
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.enrolledStudentId
        ? {
            course: {
              deletedAt: null,
              enrollments: {
                some: {
                  studentId: filters.enrolledStudentId,
                  NOT: { status: 'DROPPED' as const },
                },
              },
            },
          }
        : {}),
    };

    const where = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.moduleId ? { moduleId: filters.moduleId } : {}),
      ...(Object.keys(moduleFilter).length > 0
        ? { module: { deletedAt: null, ...moduleFilter } }
        : {}),
      ...(filters.contentType ? { contentType: filters.contentType } : {}),
      ...(filters.search
        ? {
            title: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lesson.findMany({
        where,
        select: lessonSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return { items, total };
  }

  async findModuleContext(moduleId: string): Promise<ModuleContextRecord | null> {
    return this.prisma.courseModule.findFirst({
      where: { id: moduleId, deletedAt: null },
      select: { id: true, organizationId: true, courseId: true },
    });
  }

  async findCourseTeacherId(courseId: string): Promise<string | null> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: { teacherId: true },
    });
    return course?.teacherId ?? null;
  }

  async findTeacherProfileId(organizationId: string, userId: string): Promise<string | null> {
    const profile = await this.prisma.teacherProfile.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    return profile?.id ?? null;
  }

  async findStudentProfileId(organizationId: string, userId: string): Promise<string | null> {
    const profile = await this.prisma.studentProfile.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    return profile?.id ?? null;
  }

  async studentHasAccessToLesson(lessonId: string, studentProfileId: string): Promise<boolean> {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        deletedAt: null,
        module: {
          deletedAt: null,
          course: {
            deletedAt: null,
            enrollments: {
              some: {
                studentId: studentProfileId,
                NOT: { status: 'DROPPED' },
              },
            },
          },
        },
      },
      select: { id: true },
    });
    return lesson !== null;
  }

  async create(data: CreateLessonData): Promise<LessonRecord> {
    return this.prisma.lesson.create({
      data: {
        organizationId: data.organizationId,
        moduleId: data.moduleId,
        title: data.title,
        description: data.description,
        contentType: data.contentType,
        contentUrl: data.contentUrl,
        durationSeconds: data.durationSeconds,
        displayOrder: data.displayOrder,
      },
      select: lessonSelect,
    });
  }

  async update(id: string, data: UpdateLessonData): Promise<LessonRecord> {
    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.contentType !== undefined ? { contentType: data.contentType } : {}),
        ...(data.contentUrl !== undefined ? { contentUrl: data.contentUrl } : {}),
        ...(data.durationSeconds !== undefined ? { durationSeconds: data.durationSeconds } : {}),
        ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
      },
      select: lessonSelect,
    });
  }

  async softDelete(id: string): Promise<LessonRecord> {
    return this.prisma.lesson.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: lessonSelect,
    });
  }
}
