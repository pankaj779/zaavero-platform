import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  AssignmentContextRecord,
  CourseContextRecord,
  CreateSubmissionData,
  SubmissionListFilters,
  SubmissionListResult,
  SubmissionRecord,
  SubmissionRepository,
  UpdateSubmissionData,
} from '../interfaces/submission-repository.interface';

const submissionSelect = {
  id: true,
  organizationId: true,
  assignmentId: true,
  studentId: true,
  status: true,
  content: true,
  attachments: true,
  score: true,
  feedback: true,
  submittedAt: true,
  gradedAt: true,
  gradedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaSubmissionRepository implements SubmissionRepository {
  public readonly marker = 'submission-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<SubmissionRecord | null> {
    return this.prisma.assignmentSubmission.findFirst({
      where: { id },
      select: submissionSelect,
    });
  }

  async findMany(filters: SubmissionListFilters): Promise<SubmissionListResult> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.assignmentId ? { assignmentId: filters.assignmentId } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.assignmentSubmission.findMany({
        where,
        select: submissionSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.assignmentSubmission.count({ where }),
    ]);

    return { items, total };
  }

  async findByAssignmentAndStudent(
    assignmentId: string,
    studentId: string,
  ): Promise<SubmissionRecord | null> {
    return this.prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId,
      },
      select: submissionSelect,
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
        courseId: true,
        maxScore: true,
        dueAt: true,
        deletedAt: true,
      },
    });
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

  async create(data: CreateSubmissionData): Promise<SubmissionRecord> {
    return this.prisma.assignmentSubmission.create({
      data: {
        organizationId: data.organizationId,
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        status: data.status,
        content: data.content ?? null,
        attachments: data.attachments ?? [],
        submittedAt: data.submittedAt ?? null,
      },
      select: submissionSelect,
    });
  }

  async update(id: string, data: UpdateSubmissionData): Promise<SubmissionRecord> {
    return this.prisma.assignmentSubmission.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.attachments !== undefined ? { attachments: data.attachments } : {}),
        ...(data.score !== undefined ? { score: data.score } : {}),
        ...(data.feedback !== undefined ? { feedback: data.feedback } : {}),
        ...(data.submittedAt !== undefined ? { submittedAt: data.submittedAt } : {}),
        ...(data.gradedAt !== undefined ? { gradedAt: data.gradedAt } : {}),
        ...(data.gradedById !== undefined ? { gradedById: data.gradedById } : {}),
      },
      select: submissionSelect,
    });
  }
}
