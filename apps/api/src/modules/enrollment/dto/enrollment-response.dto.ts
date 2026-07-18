import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ENROLLMENT_STATUSES, type EnrollmentStatusValue } from '../constants/enrollment.constants';

export class EnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  @ApiProperty({ format: 'uuid' })
  batchId!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ enum: ENROLLMENT_STATUSES })
  status!: EnrollmentStatusValue;

  @ApiProperty({ type: String, format: 'date-time' })
  enrolledAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class EnrollmentListMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedEnrollmentsResponseDto {
  @ApiProperty({ type: [EnrollmentResponseDto] })
  items!: EnrollmentResponseDto[];

  @ApiProperty({ type: EnrollmentListMetaDto })
  meta!: EnrollmentListMetaDto;
}
