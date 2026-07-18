import type { BatchResponseDto } from '../dto/batch-response.dto';
import type { BatchRecord } from '../interfaces/batch-repository.interface';

/**
 * Maps persistence batch records to API response DTOs.
 */
export class BatchMapper {
  static toResponse(record: BatchRecord): BatchResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      courseId: record.courseId,
      teacherId: record.teacherId,
      name: record.name,
      status: record.status,
      startDate: record.startDate.toISOString(),
      endDate: record.endDate ? record.endDate.toISOString() : null,
      maxStudents: record.maxStudents,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toResponseList(records: BatchRecord[]): BatchResponseDto[] {
    return records.map((record) => BatchMapper.toResponse(record));
  }
}
