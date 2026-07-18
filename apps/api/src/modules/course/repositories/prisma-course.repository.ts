import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  CourseListFilters,
  CourseListResult,
  CourseRecord,
  CourseRepository,
  CreateCourseData,
  UpdateCourseData,
} from '../interfaces/course-repository.interface';

const courseSelect = {
  id: true,
  organizationId: true,
  teacherId: true,
  title: true,
  slug: true,
  description: true,
  difficulty: true,
  status: true,
  language: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class PrismaCourseRepository implements CourseRepository {
  public readonly marker = 'course-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<CourseRecord | null> {
    return this.prisma.course.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: courseSelect,
    });
  }

  async findMany(filters: CourseListFilters): Promise<CourseListResult> {
    const where = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      ...(filters.language ? { language: filters.language } : {}),
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
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' as const } },
              {
                description: { contains: filters.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        select: courseSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    return { items, total };
  }

  async findByOrganizationSlug(organizationId: string, slug: string): Promise<CourseRecord | null> {
    return this.prisma.course.findFirst({
      where: {
        organizationId,
        slug,
        deletedAt: null,
      },
      select: courseSelect,
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

  async isStudentEnrolledInCourse(courseId: string, studentProfileId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        courseId,
        studentId: studentProfileId,
        NOT: { status: 'DROPPED' },
      },
      select: { id: true },
    });

    return enrollment !== null;
  }

  async create(data: CreateCourseData): Promise<CourseRecord> {
    return this.prisma.course.create({
      data: {
        organizationId: data.organizationId,
        teacherId: data.teacherId,
        title: data.title,
        slug: data.slug,
        description: data.description,
        difficulty: data.difficulty,
        status: data.status,
        language: data.language,
      },
      select: courseSelect,
    });
  }

  async update(id: string, data: UpdateCourseData): Promise<CourseRecord> {
    return this.prisma.course.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.difficulty !== undefined ? { difficulty: data.difficulty } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.language !== undefined ? { language: data.language } : {}),
        ...(data.teacherId !== undefined ? { teacherId: data.teacherId } : {}),
      },
      select: courseSelect,
    });
  }

  async softDelete(id: string): Promise<CourseRecord> {
    return this.prisma.course.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      select: courseSelect,
    });
  }
}
