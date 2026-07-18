import type { LiveSessionResponseDto } from '../dto/live-session-response.dto';
import type { LiveSessionRecord } from '../interfaces/live-session-repository.interface';

export class LiveSessionMapper {
  static toResponse(record: LiveSessionRecord): LiveSessionResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      batchId: record.batchId,
      title: record.title,
      description: record.description,
      status: record.status,
      meetingProvider: record.meetingProvider,
      meetingUrl: record.meetingUrl,
      recordingUrl: record.recordingUrl,
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt ? record.endsAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
  static toResponseList(records: LiveSessionRecord[]) {
    return records.map((r) => LiveSessionMapper.toResponse(r));
  }
}
