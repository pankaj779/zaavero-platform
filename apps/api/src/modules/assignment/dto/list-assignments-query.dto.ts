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
  ASSIGNMENT_DEFAULT_LIMIT,
  ASSIGNMENT_DEFAULT_PAGE,
  ASSIGNMENT_MAX_LIMIT,
  ASSIGNMENT_SORT_FIELDS,
  ASSIGNMENT_STATUSES,
  type AssignmentSortField,
  type AssignmentStatusValue,
} from '../constants/assignment.constants';

export class ListAssignmentsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ enum: ASSIGNMENT_STATUSES })
  @IsOptional()
  @IsIn([...ASSIGNMENT_STATUSES])
  status?: AssignmentStatusValue;

  @ApiPropertyOptional({
    description: 'Case-insensitive search against assignment title',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ default: ASSIGNMENT_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = ASSIGNMENT_DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: ASSIGNMENT_DEFAULT_LIMIT,
    minimum: 1,
    maximum: ASSIGNMENT_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ASSIGNMENT_MAX_LIMIT)
  limit: number = ASSIGNMENT_DEFAULT_LIMIT;

  @ApiPropertyOptional({
    enum: ASSIGNMENT_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn([...ASSIGNMENT_SORT_FIELDS])
  sortBy: AssignmentSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
