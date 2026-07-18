/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config/env.schema';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import type { InvitationRepository } from '../interfaces/invitation-repository.interface';
import type { EmailService } from '../services/email.service';
import { InvitationService } from '../services/invitation.service';

const admin: AuthenticatedUser = {
  id: 'user-1',
  email: 'admin@example.com',
  roles: ['Admin'],
  permissions: [],
  organizationIds: ['11111111-1111-4111-8111-111111111111'],
};

function setup() {
  const repository = {
    organizationExists: vi.fn().mockResolvedValue(true),
    roleExists: vi.fn().mockResolvedValue(true),
    listByOrganization: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation((input: Record<string, unknown>) =>
      Promise.resolve({
        ...input,
        id: 'invite-1',
        acceptedById: null,
        status: 'PENDING',
        acceptedAt: null,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ),
  } as unknown as InvitationRepository;
  const email = {
    enqueueTemplateEmail: vi.fn().mockResolvedValue({ queueId: 'queue-1' }),
  } as unknown as EmailService;
  const config = {
    get: vi.fn().mockReturnValue('https://app.example.com'),
  } as unknown as ConfigService<EnvConfig, true>;
  return {
    repository,
    email,
    service: new InvitationService(repository, email, config),
  };
}

describe('InvitationService', () => {
  it('stores only a token hash and queues the matching invitation template', async () => {
    const { repository, email, service } = setup();
    const organizationId = admin.organizationIds[0];
    if (!organizationId) throw new Error('Test organization is required.');
    const result = await service.create(admin, {
      organizationId,
      email: 'teacher@example.com',
      type: 'TEACHER',
      role: 'Teacher',
    });

    const createInput = vi.mocked(repository.create).mock.calls[0]?.[0];
    expect(createInput?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.data).not.toHaveProperty('tokenHash');
    expect(email.enqueueTemplateEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: 'teacher_invitation',
        idempotencyKey: expect.stringContaining('invitation:invite-1:teacher_invitation:'),
      }),
    );
  });

  it('limits teacher invitation lists to students', async () => {
    const { repository, service } = setup();
    const organizationId = admin.organizationIds[0];
    if (!organizationId) throw new Error('Test organization is required.');
    const teacher: AuthenticatedUser = { ...admin, roles: [AUTH_ROLES.teacher] };

    await expect(service.list(teacher, organizationId)).resolves.toMatchObject({ data: [] });
    expect(repository.listByOrganization).toHaveBeenCalledWith(organizationId, ['STUDENT']);
  });
});
