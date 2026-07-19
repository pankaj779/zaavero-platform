import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LIVE_SESSION_STATUSES,
  MEETING_PROVIDERS,
  type LiveSessionStatusValue,
  type MeetingProviderValue,
} from '../constants/live-session.constants';
import type { MeetingSyncStatusValue } from '../interfaces/live-session-repository.interface';

export class LiveSessionResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) batchId!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty({ enum: LIVE_SESSION_STATUSES }) status!: LiveSessionStatusValue;
  @ApiProperty({ enum: MEETING_PROVIDERS }) meetingProvider!: MeetingProviderValue;
  @ApiPropertyOptional({ nullable: true }) meetingUrl!: string | null;
  /** Host start URL — only populated for admin/teacher responses; always null for students. */
  @ApiPropertyOptional({ nullable: true }) hostUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) recordingUrl!: string | null;
  @ApiProperty() timezone!: string;
  @ApiPropertyOptional({ nullable: true }) recurrenceRule!: string | null;
  @ApiProperty() syncStatus!: MeetingSyncStatusValue;
  @ApiPropertyOptional({ nullable: true }) syncError!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) startsAt!: string;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) endsAt!:
    string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) startedAt!:
    | string
    | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) endedAt!:
    | string
    | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) cancelledAt!:
    | string
    | null;
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
