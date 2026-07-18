import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  AcceptInvitationData,
  CreateInvitationData,
  InvitationRecord,
  InvitationRepository,
} from '../interfaces/invitation-repository.interface';

const invitationSelect = {
  id: true,
  organizationId: true,
  invitedById: true,
  acceptedById: true,
  email: true,
  role: true,
  type: true,
  status: true,
  tokenHash: true,
  expiresAt: true,
  acceptedAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaInvitationRepository implements InvitationRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  create(data: CreateInvitationData): Promise<InvitationRecord> {
    return this.prisma.$transaction(async (tx) => {
      await tx.emailInvitation.updateMany({
        where: {
          organizationId: data.organizationId,
          email: data.email.toLowerCase(),
          type: data.type,
          status: 'PENDING',
        },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });
      return tx.emailInvitation.create({
        data: {
          organizationId: data.organizationId,
          invitedById: data.invitedById,
          email: data.email.toLowerCase(),
          role: data.role,
          type: data.type,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
        },
        select: invitationSelect,
      });
    });
  }

  listByOrganization(
    organizationId: string,
    types?: InvitationRecord['type'][],
  ): Promise<InvitationRecord[]> {
    return this.prisma.emailInvitation.findMany({
      where: {
        organizationId,
        ...(types ? { type: { in: types } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: invitationSelect,
    });
  }

  findById(id: string): Promise<InvitationRecord | null> {
    return this.prisma.emailInvitation.findUnique({ where: { id }, select: invitationSelect });
  }

  findByTokenHash(tokenHash: string): Promise<InvitationRecord | null> {
    return this.prisma.emailInvitation.findUnique({
      where: { tokenHash },
      select: invitationSelect,
    });
  }

  rotateToken(id: string, tokenHash: string, expiresAt: Date): Promise<InvitationRecord> {
    return this.prisma.emailInvitation.update({
      where: { id },
      data: { tokenHash, expiresAt, status: 'PENDING', revokedAt: null },
      select: invitationSelect,
    });
  }

  revoke(id: string): Promise<InvitationRecord> {
    return this.prisma.emailInvitation.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
      select: invitationSelect,
    });
  }

  async expire(id: string): Promise<void> {
    await this.prisma.emailInvitation.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });
  }

  async roleExists(role: string): Promise<boolean> {
    return (await this.prisma.role.count({ where: { name: role } })) > 0;
  }

  async organizationExists(id: string): Promise<boolean> {
    return (await this.prisma.organization.count({ where: { id, isActive: true } })) > 0;
  }

  async userExists(email: string): Promise<boolean> {
    return (await this.prisma.user.count({ where: { email: email.toLowerCase() } })) > 0;
  }

  accept(data: AcceptInvitationData): Promise<{ invitation: InvitationRecord; userId: string }> {
    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.emailInvitation.findUniqueOrThrow({
        where: { id: data.invitationId },
      });
      const role = await tx.role.findUniqueOrThrow({ where: { name: invitation.role } });
      const existingUser = await tx.user.findUnique({ where: { email: invitation.email } });
      if (!existingUser && (!data.firstName || !data.lastName || !data.passwordHash)) {
        throw new Error('New invitation accounts require identity and password fields.');
      }
      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            email: invitation.email,
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
            passwordHash: data.passwordHash ?? '',
            emailVerified: true,
          },
        }));

      await tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: user.id,
          },
        },
        create: {
          organizationId: invitation.organizationId,
          userId: user.id,
          status: 'ACTIVE',
        },
        update: { status: 'ACTIVE' },
      });
      await tx.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        create: { userId: user.id, roleId: role.id },
        update: {},
      });
      if (invitation.type === 'TEACHER') {
        await tx.teacherProfile.upsert({
          where: {
            organizationId_userId: {
              organizationId: invitation.organizationId,
              userId: user.id,
            },
          },
          create: { organizationId: invitation.organizationId, userId: user.id },
          update: { deletedAt: null },
        });
      }
      if (invitation.type === 'STUDENT') {
        await tx.studentProfile.upsert({
          where: {
            organizationId_userId: {
              organizationId: invitation.organizationId,
              userId: user.id,
            },
          },
          create: { organizationId: invitation.organizationId, userId: user.id },
          update: { deletedAt: null },
        });
      }

      const accepted = await tx.emailInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: user.id,
          acceptedAt: new Date(),
        },
        select: invitationSelect,
      });
      return { invitation: accepted, userId: user.id };
    });
  }
}
