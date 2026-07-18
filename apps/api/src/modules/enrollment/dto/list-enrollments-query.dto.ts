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
  ENROLLMENT_DEFAULT_LIMIT,
  ENROLLMENT_DEFAULT_PAGE,
  ENROLLMENT_MAX_LIMIT,
  ENROLLMENT_SORT_FIELDS,
  ENROLLMENT_STATUSES,
  type EnrollmentSortField,
  type EnrollmentStatusValue,
} from '../constants/enrollment.constants';

export class ListEnrollmentsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES })
  @IsOptional()
  @IsIn([...ENROLLMENT_STATUSES])
  status?: EnrollmentStatusValue;

  @ApiPropertyOptional({
    description: 'Case-insensitive search against student name or email',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ default: ENROLLMENT_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = ENROLLMENT_DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: ENROLLMENT_DEFAULT_LIMIT,
    minimum: 1,
    maximum: ENROLLMENT_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ENROLLMENT_MAX_LIMIT)
  limit: number = ENROLLMENT_DEFAULT_LIMIT;

  @ApiPropertyOptional({
    enum: ENROLLMENT_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn([...ENROLLMENT_SORT_FIELDS])
  sortBy: EnrollmentSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
