import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  BatchContextRecord,
  CreateLiveSessionData,
  LiveSessionListFilters,
  LiveSessionListResult,
  LiveSessionRecord,
  LiveSessionRepository,
  UpdateLiveSessionData,
} from '../interfaces/live-session-repository.interface';

const select = {
  id: true,
  organizationId: true,
  batchId: true,
  title: true,
  description: true,
  status: true,
  meetingProvider: true,
  meetingUrl: true,
  recordingUrl: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaLiveSessionRepository implements LiveSessionRepository {
  public readonly marker = 'live-session-repository' as const;
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<LiveSessionRecord | null> {
    return this.prisma.liveSession.findFirst({ where: { id, deletedAt: null }, select });
  }

  async findMany(filters: LiveSessionListFilters): Promise<LiveSessionListResult> {
    const where = {
      organizationId: filters.organizationId,
      deletedAt: null,
      ...(filters.batchId ? { batchId: filters.batchId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.meetingProvider ? { meetingProvider: filters.meetingProvider } : {}),
      ...(filters.enrolledStudentId
        ? {
            batch: {
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
      ...(filters.search
        ? { title: { contains: filters.search, mode: 'insensitive' as const } }
        : {}),
    };
    const skip = (filters.page - 1) * filters.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.liveSession.findMany({
        where,
        select,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.liveSession.count({ where }),
    ]);
    return { items, total };
  }

  findBatchContext(batchId: string): Promise<BatchContextRecord | null> {
    return this.prisma.batch.findFirst({
      where: { id: batchId, deletedAt: null },
      select: { id: true, organizationId: true, teacherId: true },
    });
  }

  async findTeacherProfileId(organizationId: string, userId: string): Promise<string | null> {
    const row = await this.prisma.teacherProfile.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async findStudentProfileId(organizationId: string, userId: string): Promise<string | null> {
    const row = await this.prisma.studentProfile.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async isStudentEnrolledInBatch(batchId: string, studentProfileId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { batchId, studentId: studentProfileId, NOT: { status: 'DROPPED' } },
      select: { id: true },
    });
    return enrollment !== null;
  }

  async create(data: CreateLiveSessionData): Promise<LiveSessionRecord> {
    return this.prisma.liveSession.create({
      data: {
        organizationId: data.organizationId,
        batchId: data.batchId,
        title: data.title,
        description: data.description,
        status: data.status,
        meetingProvider: data.meetingProvider,
        meetingUrl: data.meetingUrl,
        recordingUrl: data.recordingUrl,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
      select,
    });
  }

  async update(id: string, data: UpdateLiveSessionData): Promise<LiveSessionRecord> {
    return this.prisma.liveSession.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.meetingProvider !== undefined ? { meetingProvider: data.meetingProvider } : {}),
        ...(data.meetingUrl !== undefined ? { meetingUrl: data.meetingUrl } : {}),
        ...(data.recordingUrl !== undefined ? { recordingUrl: data.recordingUrl } : {}),
        ...(data.startsAt !== undefined ? { startsAt: data.startsAt } : {}),
        ...(data.endsAt !== undefined ? { endsAt: data.endsAt } : {}),
      },
      select,
    });
  }

  async softDelete(id: string): Promise<LiveSessionRecord> {
    return this.prisma.liveSession.update({
      where: { id },
      data: { deletedAt: new Date() },
      select,
    });
  }
}
