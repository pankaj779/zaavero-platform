import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  ATTENDANCE_DEFAULT_LIMIT,
  ATTENDANCE_DEFAULT_PAGE,
  ATTENDANCE_MAX_LIMIT,
  ATTENDANCE_SORT_FIELDS,
  ATTENDANCE_STATUSES,
  type AttendanceSortField,
  type AttendanceStatusValue,
} from '../constants/attendance.constants';

export class ListAttendancesQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  liveSessionId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ enum: ATTENDANCE_STATUSES })
  @IsOptional()
  @IsIn([...ATTENDANCE_STATUSES])
  status?: AttendanceStatusValue;

  @ApiPropertyOptional({ default: ATTENDANCE_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = ATTENDANCE_DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: ATTENDANCE_DEFAULT_LIMIT,
    minimum: 1,
    maximum: ATTENDANCE_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ATTENDANCE_MAX_LIMIT)
  limit: number = ATTENDANCE_DEFAULT_LIMIT;

  @ApiPropertyOptional({
    enum: ATTENDANCE_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn([...ATTENDANCE_SORT_FIELDS])
  sortBy: AttendanceSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
