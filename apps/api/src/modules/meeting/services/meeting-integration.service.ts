import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { MEETING_REPOSITORY } from '../constants/injection-tokens';
import type { MeetingIntegrationResponseDto } from '../dto/meeting-integration-response.dto';
import { OrganizationAccessDeniedException } from '../exceptions';
import type { MeetingRepository } from '../interfaces/meeting-repository.interface';
import { MeetingIntegrationMapper } from '../mappers/meeting-integration.mapper';

@Injectable()
export class MeetingIntegrationService {
  constructor(@Inject(MEETING_REPOSITORY) private readonly repo: MeetingRepository) {}

  async list(
    user: AuthenticatedUser,
    organizationId: string,
  ): Promise<{ message: string; data: MeetingIntegrationResponseDto[] }> {
    this.assertOrgAccess(user, organizationId);
    const rows = await this.repo.listIntegrations(organizationId);
    return {
      message: 'Meeting integrations retrieved successfully.',
      data: MeetingIntegrationMapper.toResponseList(rows),
    };
  }

  private assertOrgAccess(user: AuthenticatedUser, organizationId: string) {
    if (!user.organizationIds.includes(organizationId)) {
      throw new OrganizationAccessDeniedException();
    }
  }
}
