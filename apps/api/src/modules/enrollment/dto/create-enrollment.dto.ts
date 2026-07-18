import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ENROLLMENT_STATUSES, type EnrollmentStatusValue } from '../constants/enrollment.constants';

export class CreateEnrollmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  courseId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  batchId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'StudentProfile id within the organization',
  })
  @IsUUID()
  studentId!: string;

  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES, default: 'ACTIVE' })
  @IsOptional()
  @IsIn([...ENROLLMENT_STATUSES])
  status?: EnrollmentStatusValue;
}
