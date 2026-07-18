import type { CourseResponseDto } from '../dto/course-response.dto';
import type { CourseRecord } from '../interfaces/course-repository.interface';

/**
 * Maps persistence course records to API response DTOs.
 */
export class CourseMapper {
  static toResponse(record: CourseRecord): CourseResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      teacherId: record.teacherId,
      title: record.title,
      slug: record.slug,
      description: record.description,
      thumbnailUrl: record.thumbnailUrl ?? null,
      bannerUrl: record.bannerUrl ?? null,
      difficulty: record.difficulty,
      status: record.status,
      language: record.language,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toResponseList(records: CourseRecord[]): CourseResponseDto[] {
    return records.map((record) => CourseMapper.toResponse(record));
  }
}
