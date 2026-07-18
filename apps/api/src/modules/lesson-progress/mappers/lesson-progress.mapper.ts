import type { LessonProgressResponseDto } from '../dto/lesson-progress-response.dto';
import type { LessonProgressRecord } from '../interfaces/lesson-progress-repository.interface';

export class LessonProgressMapper {
  static toResponse(record: LessonProgressRecord): LessonProgressResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      lessonId: record.lessonId,
      studentId: record.studentId,
      status: record.status,
      progressPercent: record.progressPercent,
      lastPositionSeconds: record.lastPositionSeconds,
      completedAt: record.completedAt ? record.completedAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
  static toResponseList(records: LessonProgressRecord[]): LessonProgressResponseDto[] {
    return records.map((r) => LessonProgressMapper.toResponse(r));
  }
}
