import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ATTENDANCE_STATUSES, type AttendanceStatusValue } from '../constants/attendance.constants';

export class CreateAttendanceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  liveSessionId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'StudentProfile id within the organization',
  })
  @IsUUID()
  studentId!: string;

  @ApiPropertyOptional({ enum: ATTENDANCE_STATUSES, default: 'ABSENT' })
  @IsOptional()
  @IsIn([...ATTENDANCE_STATUSES])
  status?: AttendanceStatusValue;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  markedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
