import type { MeetingIntegrationResponseDto } from '../dto/meeting-integration-response.dto';
import type { MeetingIntegrationRecord } from '../interfaces/meeting-repository.interface';

export class MeetingIntegrationMapper {
  static toResponse(record: MeetingIntegrationRecord): MeetingIntegrationResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      provider: record.provider,
      status: record.status,
      externalAccountId: record.externalAccountId,
      externalAccountEmail: record.externalAccountEmail,
      scopes: record.scopes,
      lastError: record.lastError,
      connectedAt: record.connectedAt?.toISOString() ?? null,
      tokenExpiresAt: record.tokenExpiresAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toResponseList(records: MeetingIntegrationRecord[]): MeetingIntegrationResponseDto[] {
    return records.map((r) => MeetingIntegrationMapper.toResponse(r));
  }
}
