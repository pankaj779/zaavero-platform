import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SUBMISSION_STATUSES, type SubmissionStatusValue } from '../constants/submission.constants';

export class SubmissionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  assignmentId!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ enum: SUBMISSION_STATUSES })
  status!: SubmissionStatusValue;

  @ApiPropertyOptional({ nullable: true })
  content!: string | null;

  @ApiProperty({ type: [String] })
  attachments!: string[];

  @ApiPropertyOptional({ nullable: true })
  score!: number | null;

  @ApiPropertyOptional({ nullable: true })
  feedback!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  submittedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  gradedAt!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  gradedById!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class SubmissionListMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedSubmissionsResponseDto {
  @ApiProperty({ type: [SubmissionResponseDto] })
  items!: SubmissionResponseDto[];

  @ApiProperty({ type: SubmissionListMetaDto })
  meta!: SubmissionListMetaDto;
}
