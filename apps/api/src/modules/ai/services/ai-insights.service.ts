import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { assertAIOrganizationAccess } from '../utils/ai-org-access';

@Injectable()
export class AIInsightsService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async getStudentPerformanceInsights(
    user: AuthenticatedUser,
    organizationId: string,
    studentProfileId?: string,
  ) {
    assertAIOrganizationAccess(user, organizationId);
    const student = studentProfileId
      ? await this.prisma.studentProfile.findFirst({
          where: { id: studentProfileId, organizationId },
          select: { id: true, userId: true },
        })
      : await this.prisma.studentProfile.findFirst({
          where: { organizationId, userId: user.id },
          select: { id: true, userId: true },
        });
    if (!student) {
      return {
        attendanceRate: 0,
        assignmentsSubmitted: 0,
        assignmentsPending: 0,
        averageScore: null,
        riskIndicators: ['No student profile found for this organization.'],
      };
    }

    const [attendance, submissions, enrollments] = await Promise.all([
      this.prisma.attendance.groupBy({
        by: ['status'],
        where: { organizationId, studentId: student.id },
        _count: { _all: true },
      }),
      this.prisma.assignmentSubmission.groupBy({
        by: ['status'],
        where: { organizationId, studentId: student.id },
        _count: { _all: true },
      }),
      this.prisma.enrollment.count({
        where: { organizationId, studentId: student.id, status: 'ACTIVE' },
      }),
    ]);

    const present = attendance.find((row) => row.status === 'PRESENT')?._count._all ?? 0;
    const totalAttendance = attendance.reduce((sum, row) => sum + row._count._all, 0);
    const submitted =
      submissions.find((row) => row.status === 'SUBMITTED')?._count._all ?? 0;
    const pending =
      submissions.find((row) => row.status === 'PENDING')?._count._all ?? 0;

    const graded = await this.prisma.assignmentSubmission.findMany({
      where: {
        organizationId,
        studentId: student.id,
        status: 'GRADED',
        score: { not: null },
      },
      select: { score: true },
    });
    const averageScore =
      graded.length > 0
        ? graded.reduce((sum, row) => sum + (row.score ?? 0), 0) / graded.length
        : null;

    const riskIndicators: string[] = [];
    const attendanceRate = totalAttendance > 0 ? present / totalAttendance : 0;
    if (attendanceRate < 0.7) riskIndicators.push('Attendance below 70%.');
    if (pending > submitted) riskIndicators.push('More pending assignments than submitted.');
    if (enrollments === 0) riskIndicators.push('No active enrollments.');

    return {
      attendanceRate,
      assignmentsSubmitted: submitted,
      assignmentsPending: pending,
      averageScore,
      activeEnrollments: enrollments,
      riskIndicators,
    };
  }

  async getAdminEngagementSummary(user: AuthenticatedUser, organizationId: string) {
    assertAIOrganizationAccess(user, organizationId);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [users, enrollments, submissions, aiUsage] = await Promise.all([
      this.prisma.organizationMember.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.enrollment.count({ where: { organizationId, createdAt: { gte: since } } }),
      this.prisma.assignmentSubmission.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.aIUsage.aggregate({
        where: { organizationId, createdAt: { gte: since }, status: 'COMMITTED' },
        _sum: { totalTokens: true },
        _count: { _all: true },
      }),
    ]);
    return {
      activeMembers: users,
      newEnrollments30d: enrollments,
      submissions30d: submissions,
      aiTokens30d: aiUsage._sum.totalTokens ?? 0,
      aiRequests30d: aiUsage._count._all,
    };
  }
}
