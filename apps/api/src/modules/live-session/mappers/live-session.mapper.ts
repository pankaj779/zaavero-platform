import type { LiveSessionResponseDto } from '../dto/live-session-response.dto';
import type { LiveSessionRecord } from '../interfaces/live-session-repository.interface';

export class LiveSessionMapper {
  static toResponse(
    record: LiveSessionRecord,
    options?: { hostUrl?: string | null },
  ): LiveSessionResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      batchId: record.batchId,
      title: record.title,
      description: record.description,
      status: record.status,
      meetingProvider: record.meetingProvider,
      meetingUrl: record.meetingUrl,
      hostUrl: options?.hostUrl ?? null,
      recordingUrl: record.recordingUrl,
      timezone: record.timezone,
      recurrenceRule: record.recurrenceRule,
      syncStatus: record.syncStatus,
      syncError: record.syncError,
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt ? record.endsAt.toISOString() : null,
      startedAt: record.startedAt ? record.startedAt.toISOString() : null,
      endedAt: record.endedAt ? record.endedAt.toISOString() : null,
      cancelledAt: record.cancelledAt ? record.cancelledAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toResponseList(
    records: LiveSessionRecord[],
    hostUrls?: ReadonlyMap<string, string | null>,
  ) {
    return records.map((r) =>
      LiveSessionMapper.toResponse(r, { hostUrl: hostUrls?.get(r.id) ?? null }),
    );
  }
}
