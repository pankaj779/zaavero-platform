import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ASSIGNMENT_STATUSES, type AssignmentStatusValue } from '../constants/assignment.constants';

export class AssignmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  batchId!: string | null;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  instructions!: string | null;

  @ApiProperty({ enum: ASSIGNMENT_STATUSES })
  status!: AssignmentStatusValue;

  @ApiPropertyOptional({ nullable: true })
  maxScore!: number | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  dueAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deletedAt!: string | null;
}

export class AssignmentListMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedAssignmentsResponseDto {
  @ApiProperty({ type: [AssignmentResponseDto] })
  items!: AssignmentResponseDto[];

  @ApiProperty({ type: AssignmentListMetaDto })
  meta!: AssignmentListMetaDto;
}
