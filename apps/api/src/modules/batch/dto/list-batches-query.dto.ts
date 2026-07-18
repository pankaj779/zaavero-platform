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
  BATCH_DEFAULT_LIMIT,
  BATCH_DEFAULT_PAGE,
  BATCH_MAX_LIMIT,
  BATCH_SORT_FIELDS,
  BATCH_STATUSES,
  type BatchSortField,
  type BatchStatusValue,
} from '../constants/batch.constants';

export class ListBatchesQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Required when the user belongs to multiple organizations',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive search against batch name',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: BATCH_STATUSES })
  @IsOptional()
  @IsIn([...BATCH_STATUSES])
  status?: BatchStatusValue;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ default: BATCH_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = BATCH_DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: BATCH_DEFAULT_LIMIT,
    minimum: 1,
    maximum: BATCH_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(BATCH_MAX_LIMIT)
  limit: number = BATCH_DEFAULT_LIMIT;

  @ApiPropertyOptional({
    enum: BATCH_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn([...BATCH_SORT_FIELDS])
  sortBy: BatchSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
