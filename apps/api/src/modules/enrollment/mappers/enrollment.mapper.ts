import type { EnrollmentResponseDto } from '../dto/enrollment-response.dto';
import type { EnrollmentRecord } from '../interfaces/enrollment-repository.interface';

/**
 * Maps persistence enrollment records to API response DTOs.
 */
export class EnrollmentMapper {
  static toResponse(record: EnrollmentRecord): EnrollmentResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      courseId: record.courseId,
      batchId: record.batchId,
      studentId: record.studentId,
      status: record.status,
      enrolledAt: record.enrolledAt.toISOString(),
      completedAt: record.completedAt ? record.completedAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toResponseList(records: EnrollmentRecord[]): EnrollmentResponseDto[] {
    return records.map((record) => EnrollmentMapper.toResponse(record));
  }
}
