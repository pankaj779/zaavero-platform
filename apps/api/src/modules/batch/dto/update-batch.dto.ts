import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { BATCH_STATUSES, type BatchStatusValue } from '../constants/batch.constants';

export class UpdateBatchDto {
  @ApiPropertyOptional({ example: 'Morning Cohort A' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional({ enum: BATCH_STATUSES })
  @IsOptional()
  @IsIn([...BATCH_STATUSES])
  status?: BatchStatusValue;

  @ApiPropertyOptional({
    example: 30,
    nullable: true,
    description: 'When provided (non-null), must be greater than zero',
  })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxStudents?: number | null;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Reassign batch ownership to another teacher profile in the organization',
  })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
