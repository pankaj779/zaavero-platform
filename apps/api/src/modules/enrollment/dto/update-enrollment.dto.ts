import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, ValidateIf } from 'class-validator';
import { ENROLLMENT_STATUSES, type EnrollmentStatusValue } from '../constants/enrollment.constants';

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({ enum: ENROLLMENT_STATUSES })
  @IsOptional()
  @IsIn([...ENROLLMENT_STATUSES])
  status?: EnrollmentStatusValue;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsDateString()
  completedAt?: string | null;
}
