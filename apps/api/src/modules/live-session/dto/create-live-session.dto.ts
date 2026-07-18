import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  LIVE_SESSION_STATUSES,
  MEETING_PROVIDERS,
  type LiveSessionStatusValue,
  type MeetingProviderValue,
} from '../constants/live-session.constants';

export class CreateLiveSessionDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() batchId!: string;
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional({ enum: LIVE_SESSION_STATUSES })
  @IsOptional()
  @IsIn([...LIVE_SESSION_STATUSES])
  status?: LiveSessionStatusValue;
  @ApiPropertyOptional({ enum: MEETING_PROVIDERS })
  @IsOptional()
  @IsIn([...MEETING_PROVIDERS])
  meetingProvider?: MeetingProviderValue;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) meetingUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) recordingUrl?: string;
  @ApiProperty({ type: String, format: 'date-time' }) @IsDateString() startsAt!: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
