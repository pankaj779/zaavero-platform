import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LIVE_SESSION_STATUSES,
  MEETING_PROVIDERS,
  type LiveSessionStatusValue,
  type MeetingProviderValue,
} from '../constants/live-session.constants';

export class LiveSessionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) batchId!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty({ enum: LIVE_SESSION_STATUSES }) status!: LiveSessionStatusValue;
  @ApiProperty({ enum: MEETING_PROVIDERS }) meetingProvider!: MeetingProviderValue;
  @ApiPropertyOptional({ nullable: true }) meetingUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) recordingUrl!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) startsAt!: string;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) endsAt!:
    string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}
export class LiveSessionListMetaDto {
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}
export class PaginatedLiveSessionsResponseDto {
  @ApiProperty({ type: [LiveSessionResponseDto] }) items!: LiveSessionResponseDto[];
  @ApiProperty({ type: LiveSessionListMetaDto }) meta!: LiveSessionListMetaDto;
}
