import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BATCH_STATUSES, type BatchStatusValue } from '../constants/batch.constants';

export class BatchResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  @ApiProperty({ format: 'uuid' })
  teacherId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: BATCH_STATUSES })
  status!: BatchStatusValue;

  @ApiProperty({ type: String, format: 'date-time' })
  startDate!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  maxStudents!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class BatchListMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedBatchesResponseDto {
  @ApiProperty({ type: [BatchResponseDto] })
  items!: BatchResponseDto[];

  @ApiProperty({ type: BatchListMetaDto })
  meta!: BatchListMetaDto;
}
