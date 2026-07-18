import type { LessonResponseDto } from '../dto/lesson-response.dto';
import type { LessonRecord } from '../interfaces/lesson-repository.interface';

export class LessonMapper {
  static toResponse(record: LessonRecord): LessonResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      moduleId: record.moduleId,
      title: record.title,
      description: record.description,
      contentType: record.contentType,
      contentUrl: record.contentUrl,
      durationSeconds: record.durationSeconds,
      displayOrder: record.displayOrder,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toResponseList(records: LessonRecord[]): LessonResponseDto[] {
    return records.map((record) => LessonMapper.toResponse(record));
  }
}
