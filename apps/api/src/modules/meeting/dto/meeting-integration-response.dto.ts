import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MEETING_INTEGRATION_STATUSES,
  MEETING_PROVIDERS,
  type MeetingIntegrationStatusValue,
  type MeetingProviderValue,
} from '../constants/meeting.constants';

export class MeetingIntegrationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ enum: MEETING_PROVIDERS }) provider!: MeetingProviderValue;
  @ApiProperty({ enum: MEETING_INTEGRATION_STATUSES }) status!: MeetingIntegrationStatusValue;
  @ApiPropertyOptional({ nullable: true }) externalAccountId!: string | null;
  @ApiPropertyOptional({ nullable: true }) externalAccountEmail!: string | null;
  @ApiProperty({ type: [String] }) scopes!: string[];
  @ApiPropertyOptional({ nullable: true }) lastError!: string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) connectedAt!:
    | string
    | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) tokenExpiresAt!:
    | string
    | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}

export class MeetingOAuthStartResponseDto {
  @ApiProperty() authorizeUrl!: string;
  @ApiProperty({ format: 'uuid' }) integrationId!: string;
  @ApiProperty({ enum: MEETING_PROVIDERS }) provider!: MeetingProviderValue;
}
