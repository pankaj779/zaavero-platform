import type { SubmissionResponseDto } from '../dto/submission-response.dto';
import type { SubmissionRecord } from '../interfaces/submission-repository.interface';

/**
 * Maps persistence submission records to API response DTOs.
 */
export class SubmissionMapper {
  static toResponse(record: SubmissionRecord): SubmissionResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      assignmentId: record.assignmentId,
      studentId: record.studentId,
      status: record.status,
      content: record.content,
      attachments: record.attachments,
      score: record.score,
      feedback: record.feedback,
      submittedAt: record.submittedAt ? record.submittedAt.toISOString() : null,
      gradedAt: record.gradedAt ? record.gradedAt.toISOString() : null,
      gradedById: record.gradedById,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toResponseList(records: SubmissionRecord[]): SubmissionResponseDto[] {
    return records.map((record) => SubmissionMapper.toResponse(record));
  }
}
