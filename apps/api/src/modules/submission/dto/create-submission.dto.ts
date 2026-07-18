import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { SUBMISSION_STATUSES, type SubmissionStatusValue } from '../constants/submission.constants';

export class CreateSubmissionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assignmentId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Required for Admin/Teacher; ignored for Student (uses own profile)',
  })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  content?: string | null;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({ enum: SUBMISSION_STATUSES, default: 'PENDING' })
  @IsOptional()
  @IsIn([...SUBMISSION_STATUSES])
  status?: SubmissionStatusValue;
}
