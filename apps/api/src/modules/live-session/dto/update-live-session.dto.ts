import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  LIVE_SESSION_STATUSES,
  MEETING_PROVIDERS,
  type LiveSessionStatusValue,
  type MeetingProviderValue,
} from '../constants/live-session.constants';

export class UpdateLiveSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(5000) description?:
    string | null;
  @ApiPropertyOptional({ enum: LIVE_SESSION_STATUSES })
  @IsOptional()
  @IsIn([...LIVE_SESSION_STATUSES])
  status?: LiveSessionStatusValue;
  @ApiPropertyOptional({ enum: MEETING_PROVIDERS })
  @IsOptional()
  @IsIn([...MEETING_PROVIDERS])
  meetingProvider?: MeetingProviderValue;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(2000) meetingUrl?:
    string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recordingUrl?: string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  endsAt?: string | null;
}
