import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  LIVE_SESSION_DEFAULT_LIMIT,
  LIVE_SESSION_DEFAULT_PAGE,
  LIVE_SESSION_MAX_LIMIT,
  LIVE_SESSION_SORT_FIELDS,
  LIVE_SESSION_STATUSES,
  MEETING_PROVIDERS,
  type LiveSessionSortField,
  type LiveSessionStatusValue,
  type MeetingProviderValue,
} from '../constants/live-session.constants';

export class ListLiveSessionsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() organizationId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() batchId?: string;
  @ApiPropertyOptional({ enum: LIVE_SESSION_STATUSES })
  @IsOptional()
  @IsIn([...LIVE_SESSION_STATUSES])
  status?: LiveSessionStatusValue;
  @ApiPropertyOptional({ enum: MEETING_PROVIDERS })
  @IsOptional()
  @IsIn([...MEETING_PROVIDERS])
  meetingProvider?: MeetingProviderValue;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
  @ApiPropertyOptional({ default: LIVE_SESSION_DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = LIVE_SESSION_DEFAULT_PAGE;
  @ApiPropertyOptional({ default: LIVE_SESSION_DEFAULT_LIMIT, maximum: LIVE_SESSION_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIVE_SESSION_MAX_LIMIT)
  limit: number = LIVE_SESSION_DEFAULT_LIMIT;
  @ApiPropertyOptional({ enum: LIVE_SESSION_SORT_FIELDS, default: 'startsAt' })
  @IsOptional()
  @IsIn([...LIVE_SESSION_SORT_FIELDS])
  sortBy: LiveSessionSortField = 'startsAt';
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'asc';
}
