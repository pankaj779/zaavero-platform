import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PrismaClient } from '@graphology/database';
import type { EnvConfig } from '../../../config/env.schema';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import { EmailService } from './email.service';

interface EnqueueForUserInput {
  organizationId: string;
  userId: string;
  templateKey: string;
  actionPath: string;
  entityType: string;
  entityId: string;
  idempotencySuffix?: string;
  createdById?: string;
  category?: 'SECURITY' | 'SYSTEM';
  attachments?: {
    filename: string;
    url: string;
    contentType: string;
    sizeBytes: number;
  }[];
  scheduledAt?: Date;
}

@Injectable()
export class BusinessEmailService {
  private readonly logger = new Logger(BusinessEmailService.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly email: EmailService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async enqueueForUser(input: EnqueueForUserInput): Promise<void> {
    const recipient = await this.prisma.user.findFirst({
      where: {
        id: input.userId,
        isActive: true,
        deletedAt: null,
        organizationMembers: {
          some: { organizationId: input.organizationId, status: 'ACTIVE' },
        },
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (!recipient) return;

    try {
      await this.email.enqueueTemplateEmail({
        organizationId: input.organizationId,
        userId: recipient.id,
        createdById: input.createdById,
        to: recipient.email,
        templateKey: input.templateKey,
        category: input.category,
        variables: {
          recipientName: `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.email,
          actionUrl: this.actionUrl(input.actionPath),
        },
        idempotencyKey: `${input.entityType}:${input.entityId}:${input.templateKey}${input.idempotencySuffix ? `:${input.idempotencySuffix}` : ''}`,
        entityType: input.entityType,
        entityId: input.entityId,
        attachments: input.attachments,
        scheduledAt: input.scheduledAt,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Unable to enqueue ${input.templateKey} for ${input.entityType}=${input.entityId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async enqueueForUserPrimaryOrganization(
    userId: string,
    event: Omit<EnqueueForUserInput, 'organizationId' | 'userId'>,
  ): Promise<void> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, status: 'ACTIVE', organization: { isActive: true } },
      orderBy: { joinedAt: 'asc' },
      select: { organizationId: true },
    });
    if (membership) {
      await this.enqueueForUser({
        ...event,
        organizationId: membership.organizationId,
        userId,
      });
    }
  }

  async enqueueForStudent(
    organizationId: string,
    studentId: string,
    event: Omit<EnqueueForUserInput, 'organizationId' | 'userId'>,
  ): Promise<void> {
    const profile = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, organizationId, deletedAt: null },
      select: { userId: true },
    });
    if (profile) await this.enqueueForUser({ ...event, organizationId, userId: profile.userId });
  }

  async enqueueForOrganizationAdmins(
    organizationId: string,
    event: Omit<EnqueueForUserInput, 'organizationId' | 'userId'>,
  ): Promise<void> {
    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        user: {
          isActive: true,
          deletedAt: null,
          userRoles: { some: { role: { name: 'Admin' } } },
        },
      },
      select: { userId: true },
    });
    await Promise.all(
      members.map(({ userId }) =>
        this.enqueueForUser({
          ...event,
          organizationId,
          userId,
          idempotencySuffix: userId,
        }),
      ),
    );
  }

  async paymentCaptured(orderId: string, paymentId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        organizationId: true,
        customerId: true,
        purpose: true,
        invoice: { select: { id: true } },
        subscription: { select: { id: true, planId: true } },
      },
    });
    if (!order) return;

    await this.enqueueForUser({
      organizationId: order.organizationId,
      userId: order.customerId,
      templateKey: 'payment_successful',
      actionPath: `/payments/orders/${order.id}`,
      entityType: 'payment',
      entityId: paymentId,
    });
    if (order.invoice) {
      await this.enqueueForUser({
        organizationId: order.organizationId,
        userId: order.customerId,
        templateKey: 'invoice_available',
        actionPath: `/payments/invoices/${order.invoice.id}`,
        entityType: 'invoice',
        entityId: order.invoice.id,
      });
    }
    if (order.purpose === 'ORGANIZATION_SUBSCRIPTION' && order.subscription) {
      // A repeat purchase of the same plan is a renewal; a first purchase or a
      // plan change starts a new subscription.
      const priorSamePlan = await this.prisma.subscription.count({
        where: {
          organizationId: order.organizationId,
          planId: order.subscription.planId,
          id: { not: order.subscription.id },
        },
      });
      await this.enqueueForOrganizationAdmins(order.organizationId, {
        templateKey: priorSamePlan > 0 ? 'subscription_renewed' : 'subscription_started',
        actionPath: '/admin/payments/subscriptions',
        entityType: 'subscription',
        entityId: order.subscription.id,
      });
    }
  }

  async subscriptionCancelled(subscriptionId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { id: true, organizationId: true },
    });
    if (!subscription) return;
    await this.enqueueForOrganizationAdmins(subscription.organizationId, {
      templateKey: 'subscription_cancelled',
      actionPath: '/admin/payments/subscriptions',
      entityType: 'subscription',
      entityId: subscription.id,
    });
  }

  async refundProcessed(refundId: string): Promise<void> {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      select: {
        id: true,
        organizationId: true,
        order: { select: { customerId: true } },
      },
    });
    if (!refund) return;
    await this.enqueueForUser({
      organizationId: refund.organizationId,
      userId: refund.order.customerId,
      templateKey: 'refund_processed',
      actionPath: '/payments/history',
      entityType: 'refund',
      entityId: refund.id,
    });
  }

  async certificateIssued(certificateId: string): Promise<void> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      select: {
        id: true,
        organizationId: true,
        studentId: true,
        verificationCode: true,
        pdfUrl: true,
      },
    });
    if (!certificate) return;
    const safePdfUrl = this.httpsUrlOrNull(certificate.pdfUrl);
    await this.enqueueForStudent(certificate.organizationId, certificate.studentId, {
      templateKey: 'certificate_issued',
      actionPath: `/certificates/verify/${encodeURIComponent(certificate.verificationCode)}`,
      entityType: 'certificate',
      entityId: certificate.id,
      attachments: safePdfUrl
        ? [
            {
              filename: `certificate-${certificate.id}.pdf`,
              url: safePdfUrl,
              contentType: 'application/pdf',
              sizeBytes: 0,
            },
          ]
        : undefined,
    });
  }

  async notificationCreated(notificationId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, organizationId: true, userId: true, channel: true, type: true },
    });
    if (notification?.channel !== 'EMAIL') return;
    await this.enqueueForUser({
      organizationId: notification.organizationId,
      userId: notification.userId,
      templateKey: notification.type.toLowerCase().includes('announcement')
        ? 'announcement'
        : 'general_notification',
      actionPath: '/notifications',
      entityType: 'notification',
      entityId: notification.id,
    });
  }

  async enrollmentCreated(enrollmentId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, organizationId: true, studentId: true, batchId: true },
    });
    if (!enrollment) return;
    await this.enqueueForStudent(enrollment.organizationId, enrollment.studentId, {
      templateKey: 'course_enrollment',
      actionPath: '/student/courses',
      entityType: 'enrollment',
      entityId: enrollment.id,
    });
    await this.enqueueForStudent(enrollment.organizationId, enrollment.studentId, {
      templateKey: 'batch_enrollment',
      actionPath: `/student/batches/${enrollment.batchId}`,
      entityType: 'enrollment',
      entityId: enrollment.id,
    });
  }

  async assignmentPublished(assignmentId: string): Promise<void> {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, organizationId: true, courseId: true, batchId: true },
    });
    if (!assignment) return;
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        organizationId: assignment.organizationId,
        courseId: assignment.courseId,
        ...(assignment.batchId ? { batchId: assignment.batchId } : {}),
        status: 'ACTIVE',
      },
      select: { studentId: true },
    });
    await Promise.all(
      enrollments.map(({ studentId }) =>
        this.enqueueForStudent(assignment.organizationId, studentId, {
          templateKey: 'assignment_published',
          actionPath: `/student/assignments/${assignment.id}`,
          entityType: 'assignment',
          entityId: assignment.id,
          idempotencySuffix: studentId,
        }),
      ),
    );
  }

  async submissionSubmitted(submissionId: string): Promise<void> {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        organizationId: true,
        assignment: {
          select: {
            course: { select: { teacher: { select: { userId: true } } } },
          },
        },
      },
    });
    if (!submission) return;
    await this.enqueueForUser({
      organizationId: submission.organizationId,
      userId: submission.assignment.course.teacher.userId,
      templateKey: 'assignment_submitted',
      actionPath: `/teacher/submissions/${submission.id}`,
      entityType: 'submission',
      entityId: submission.id,
    });
  }

  async submissionGraded(submissionId: string): Promise<void> {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, organizationId: true, studentId: true },
    });
    if (!submission) return;
    await this.enqueueForStudent(submission.organizationId, submission.studentId, {
      templateKey: 'assignment_graded',
      actionPath: `/student/submissions/${submission.id}`,
      entityType: 'submission',
      entityId: submission.id,
    });
  }

  async liveSessionCreated(sessionId: string): Promise<void> {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { id: true, organizationId: true, batchId: true, startsAt: true },
    });
    if (!session) return;
    const enrollments = await this.prisma.enrollment.findMany({
      where: { batchId: session.batchId, status: 'ACTIVE' },
      select: { studentId: true },
    });
    const reminderAt = new Date(session.startsAt.getTime() - 60 * 60 * 1_000);
    await Promise.all(
      enrollments.map(({ studentId }) =>
        this.enqueueForStudent(session.organizationId, studentId, {
          templateKey: 'live_reminder',
          actionPath: `/student/live-sessions/${session.id}`,
          entityType: 'live-session',
          entityId: session.id,
          idempotencySuffix: studentId,
          scheduledAt: reminderAt > new Date() ? reminderAt : undefined,
        }),
      ),
    );
  }

  async liveSessionCancelled(sessionId: string): Promise<void> {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { id: true, organizationId: true, batchId: true },
    });
    if (!session) return;
    const enrollments = await this.prisma.enrollment.findMany({
      where: { batchId: session.batchId, status: 'ACTIVE' },
      select: { studentId: true },
    });
    await Promise.all(
      enrollments.map(({ studentId }) =>
        this.enqueueForStudent(session.organizationId, studentId, {
          templateKey: 'live_cancelled',
          actionPath: '/student/live-sessions',
          entityType: 'live-session',
          entityId: session.id,
          idempotencySuffix: studentId,
        }),
      ),
    );
  }

  private actionUrl(path: string): string {
    return new URL(path, this.config.get('FRONTEND_URL', { infer: true })).toString();
  }

  private httpsUrlOrNull(value: string | null): string | null {
    if (!value) return null;
    try {
      return new URL(value).protocol === 'https:' ? value : null;
    } catch {
      return null;
    }
  }
}
