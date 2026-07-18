import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'argon2';
import type { EnvConfig } from '../../../config/env.schema';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { INVITATION_REPOSITORY } from '../constants/injection-tokens';
import type { AcceptInvitationDto, CreateInvitationDto } from '../dto/invitation.dto';
import type {
  InvitationRecord,
  InvitationRepository,
} from '../interfaces/invitation-repository.interface';
import { EmailService } from './email.service';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @Inject(INVITATION_REPOSITORY)
    private readonly repository: InvitationRepository,
    private readonly email: EmailService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateInvitationDto) {
    this.assertCanInvite(user, dto.organizationId, dto.type);
    const role =
      dto.type === 'TEACHER'
        ? AUTH_ROLES.teacher
        : dto.type === 'STUDENT'
          ? AUTH_ROLES.student
          : dto.role.trim();
    this.assertTypeRole(dto.type, role);
    if (
      !(await this.repository.organizationExists(dto.organizationId)) ||
      !(await this.repository.roleExists(role))
    ) {
      throw new BadRequestException('The organization or role is invalid.');
    }

    const token = this.generateToken();
    const invitation = await this.repository.create({
      organizationId: dto.organizationId,
      invitedById: user.id,
      email: dto.email,
      role,
      type: dto.type,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    });
    await this.enqueue(invitation, token);
    return {
      message: 'Invitation created and queued for delivery.',
      data: this.publicRecord(invitation),
    };
  }

  async list(user: AuthenticatedUser, organizationId: string) {
    if (!user.organizationIds.includes(organizationId)) {
      throw new ForbiddenException('Organization access denied.');
    }
    const types = user.roles.includes(AUTH_ROLES.admin)
      ? undefined
      : user.roles.includes(AUTH_ROLES.teacher)
        ? (['STUDENT'] as const)
        : [];
    if (types?.length === 0) {
      throw new ForbiddenException('You cannot view invitations.');
    }
    const invitations = await this.repository.listByOrganization(
      organizationId,
      types ? [...types] : undefined,
    );
    return {
      message: 'Invitations retrieved.',
      data: invitations.map((invitation) => this.publicRecord(invitation)),
    };
  }

  async resend(user: AuthenticatedUser, organizationId: string, id: string) {
    const current = await this.requireAccessible(user, organizationId, id);
    if (current.status === 'ACCEPTED' || current.status === 'REVOKED') {
      throw new ConflictException(`A ${current.status.toLowerCase()} invitation cannot be resent.`);
    }
    const token = this.generateToken();
    const invitation = await this.repository.rotateToken(
      current.id,
      this.hashToken(token),
      new Date(Date.now() + INVITATION_TTL_MS),
    );
    await this.enqueue(invitation, token);
    return { message: 'Invitation re-queued for delivery.', data: this.publicRecord(invitation) };
  }

  async revoke(user: AuthenticatedUser, organizationId: string, id: string) {
    const invitation = await this.requireAccessible(user, organizationId, id);
    if (invitation.status !== 'PENDING') {
      throw new ConflictException('Only pending invitations can be revoked.');
    }
    const revoked = await this.repository.revoke(id);
    return { message: 'Invitation revoked.', data: this.publicRecord(revoked) };
  }

  async accept(dto: AcceptInvitationDto) {
    const invitation = await this.repository.findByTokenHash(this.hashToken(dto.token));
    if (invitation?.status !== 'PENDING') {
      throw new BadRequestException('Invitation token is invalid.');
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      await this.repository.expire(invitation.id);
      throw new BadRequestException('Invitation token has expired.');
    }

    const existingUser = await this.repository.userExists(invitation.email);
    if (!existingUser && (!dto.firstName || !dto.lastName || !dto.password)) {
      throw new BadRequestException(
        'firstName, lastName, and password are required to create the invited account.',
      );
    }
    const accepted = await this.repository.accept({
      invitationId: invitation.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash: dto.password ? await hash(dto.password) : undefined,
    });
    return {
      message: 'Invitation accepted successfully.',
      data: { invitationId: accepted.invitation.id, userId: accepted.userId },
    };
  }

  private async enqueue(invitation: InvitationRecord, rawToken: string): Promise<void> {
    const templateKey = `${invitation.type.toLowerCase()}_invitation`;
    const actionUrl = new URL(
      '/accept-invitation',
      this.config.get('FRONTEND_URL', { infer: true }),
    );
    actionUrl.searchParams.set('token', rawToken);
    try {
      await this.email.enqueueTemplateEmail({
        organizationId: invitation.organizationId,
        to: invitation.email,
        templateKey,
        variables: {
          recipientName: invitation.email.split('@')[0] ?? 'there',
          actionUrl: actionUrl.toString(),
        },
        idempotencyKey: `invitation:${invitation.id}:${templateKey}:${invitation.tokenHash.slice(0, 12)}`,
        entityType: 'invitation',
        entityId: invitation.id,
        createdById: invitation.invitedById ?? undefined,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Unable to queue invitation ${invitation.id}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async requireAccessible(
    user: AuthenticatedUser,
    organizationId: string,
    id: string,
  ): Promise<InvitationRecord> {
    const invitation = await this.repository.findById(id);
    if (invitation?.organizationId !== organizationId) {
      throw new NotFoundException('Invitation not found.');
    }
    this.assertCanInvite(user, organizationId, invitation.type);
    return invitation;
  }

  private assertCanInvite(
    user: AuthenticatedUser,
    organizationId: string,
    type: InvitationRecord['type'],
  ): void {
    if (!user.organizationIds.includes(organizationId)) {
      throw new ForbiddenException('Organization access denied.');
    }
    if (user.roles.includes(AUTH_ROLES.admin)) return;
    if (user.roles.includes(AUTH_ROLES.teacher) && type === 'STUDENT') return;
    throw new ForbiddenException('You cannot create this invitation type.');
  }

  private assertTypeRole(type: InvitationRecord['type'], role: string): void {
    if (
      (type === 'TEACHER' && role !== AUTH_ROLES.teacher) ||
      (type === 'STUDENT' && role !== AUTH_ROLES.student)
    ) {
      throw new BadRequestException('Invitation type and role do not match.');
    }
  }

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicRecord(invitation: InvitationRecord) {
    const { tokenHash: _tokenHash, ...record } = invitation;
    return record;
  }
}
