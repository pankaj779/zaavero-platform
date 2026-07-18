import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  AttendanceListFilters,
  AttendanceListResult,
  AttendanceRecord,
  AttendanceRepository,
  CreateAttendanceData,
  LiveSessionContextRecord,
  UpdateAttendanceData,
} from '../interfaces/attendance-repository.interface';

const attendanceSelect = {
  id: true,
  organizationId: true,
  liveSessionId: true,
  studentId: true,
  status: true,
  markedAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaAttendanceRepository implements AttendanceRepository {
  public readonly marker = 'attendance-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<AttendanceRecord | null> {
    return this.prisma.attendance.findFirst({
      where: { id },
      select: attendanceSelect,
    });
  }

  async findMany(filters: AttendanceListFilters): Promise<AttendanceListResult> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.liveSessionId ? { liveSessionId: filters.liveSessionId } : {}),
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        select: attendanceSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { items, total };
  }

  async findByLiveSessionAndStudent(
    liveSessionId: string,
    studentId: string,
  ): Promise<AttendanceRecord | null> {
    return this.prisma.attendance.findFirst({
      where: {
        liveSessionId,
        studentId,
      },
      select: attendanceSelect,
    });
  }

  async findLiveSessionContext(liveSessionId: string): Promise<LiveSessionContextRecord | null> {
    const session = await this.prisma.liveSession.findFirst({
      where: {
        id: liveSessionId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
        batchId: true,
        batch: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      organizationId: session.organizationId,
      batchId: session.batchId,
      batchTeacherId: session.batch.teacherId,
    };
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

  async create(data: CreateAttendanceData): Promise<AttendanceRecord> {
    return this.prisma.attendance.create({
      data: {
        organizationId: data.organizationId,
        liveSessionId: data.liveSessionId,
        studentId: data.studentId,
        status: data.status,
        markedAt: data.markedAt,
        notes: data.notes,
      },
      select: attendanceSelect,
    });
  }

  async update(id: string, data: UpdateAttendanceData): Promise<AttendanceRecord> {
    return this.prisma.attendance.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.markedAt !== undefined ? { markedAt: data.markedAt } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      select: attendanceSelect,
    });
  }
}
