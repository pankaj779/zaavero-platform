import type { NotificationResponseDto } from '../dto/notification-response.dto';
import type { NotificationRecord } from '../interfaces/notification-repository.interface';

export class NotificationMapper {
  static toResponse(record: NotificationRecord): NotificationResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      userId: record.userId,
      channel: record.channel,
      type: record.type,
      title: record.title,
      body: record.body,
      data: record.data ?? null,
      readAt: record.readAt ? record.readAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toResponseList(records: NotificationRecord[]): NotificationResponseDto[] {
    return records.map((record) => NotificationMapper.toResponse(record));
  }
}
