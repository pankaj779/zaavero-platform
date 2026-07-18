import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  SUBMISSION_DEFAULT_LIMIT,
  SUBMISSION_DEFAULT_PAGE,
  SUBMISSION_MAX_LIMIT,
  SUBMISSION_SORT_FIELDS,
  SUBMISSION_STATUSES,
  type SubmissionSortField,
  type SubmissionStatusValue,
} from '../constants/submission.constants';

export class ListSubmissionsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ enum: SUBMISSION_STATUSES })
  @IsOptional()
  @IsIn([...SUBMISSION_STATUSES])
  status?: SubmissionStatusValue;

  @ApiPropertyOptional({ default: SUBMISSION_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = SUBMISSION_DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: SUBMISSION_DEFAULT_LIMIT,
    minimum: 1,
    maximum: SUBMISSION_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(SUBMISSION_MAX_LIMIT)
  limit: number = SUBMISSION_DEFAULT_LIMIT;

  @ApiPropertyOptional({
    enum: SUBMISSION_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn([...SUBMISSION_SORT_FIELDS])
  sortBy: SubmissionSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
