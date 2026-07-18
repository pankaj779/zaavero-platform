import type { AssignmentResponseDto } from '../dto/assignment-response.dto';
import type { AssignmentRecord } from '../interfaces/assignment-repository.interface';

/**
 * Maps persistence assignment records to API response DTOs.
 */
export class AssignmentMapper {
  static toResponse(record: AssignmentRecord): AssignmentResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      courseId: record.courseId,
      batchId: record.batchId,
      title: record.title,
      instructions: record.instructions,
      status: record.status,
      maxScore: record.maxScore,
      dueAt: record.dueAt ? record.dueAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
    };
  }

  static toResponseList(records: AssignmentRecord[]): AssignmentResponseDto[] {
    return records.map((record) => AssignmentMapper.toResponse(record));
  }
}
