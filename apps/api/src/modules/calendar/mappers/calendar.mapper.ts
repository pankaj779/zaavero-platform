import type { CalendarEventResponseDto } from '../dto/calendar-response.dto';
import type { CalendarEventRecord } from '../interfaces/calendar-repository.interface';

export class CalendarMapper {
  static toResponse(record: CalendarEventRecord): CalendarEventResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      courseId: record.courseId,
      batchId: record.batchId,
      liveSessionId: record.liveSessionId,
      assignmentId: record.assignmentId,
      title: record.title,
      description: record.description,
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt ? record.endsAt.toISOString() : null,
      allDay: record.allDay,
      externalProvider: record.externalProvider,
      externalEventId: record.externalEventId,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
    };
  }

  static toResponseList(records: CalendarEventRecord[]): CalendarEventResponseDto[] {
    return records.map((record) => CalendarMapper.toResponse(record));
  }
}
