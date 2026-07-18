import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ATTENDANCE_STATUSES, type AttendanceStatusValue } from '../constants/attendance.constants';

export class AttendanceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  liveSessionId!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ enum: ATTENDANCE_STATUSES })
  status!: AttendanceStatusValue;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  markedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class AttendanceListMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedAttendancesResponseDto {
  @ApiProperty({ type: [AttendanceResponseDto] })
  items!: AttendanceResponseDto[];

  @ApiProperty({ type: AttendanceListMetaDto })
  meta!: AttendanceListMetaDto;
}
