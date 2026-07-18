import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
} from 'class-validator';
import { BATCH_STATUSES, type BatchStatusValue } from '../constants/batch.constants';

export class CreateBatchDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Organization that owns the batch',
  })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Course this batch belongs to',
  })
  @IsUUID()
  courseId!: string;

  @ApiProperty({ example: 'Morning Cohort A' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: BATCH_STATUSES, default: 'UPCOMING' })
  @IsOptional()
  @IsIn([...BATCH_STATUSES])
  status?: BatchStatusValue;

  @ApiPropertyOptional({
    example: 30,
    description: 'Maximum seats; when provided must be greater than zero',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxStudents?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Teacher profile id. Teachers default to their own profile; Admins may assign.',
  })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
