import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CALENDAR_PROVIDERS, type CalendarProviderValue } from '../constants/calendar.constants';

export class CalendarEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  courseId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  batchId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  liveSessionId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  assignmentId!: string | null;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  startsAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endsAt!: string | null;

  @ApiProperty()
  allDay!: boolean;

  @ApiProperty({ enum: CALENDAR_PROVIDERS })
  externalProvider!: CalendarProviderValue;

  @ApiPropertyOptional({ nullable: true })
  externalEventId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  deletedAt!: string | null;
}

export class CalendarListMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedCalendarEventsResponseDto {
  @ApiProperty({ type: [CalendarEventResponseDto] })
  items!: CalendarEventResponseDto[];

  @ApiProperty({ type: CalendarListMetaDto })
  meta!: CalendarListMetaDto;
}
