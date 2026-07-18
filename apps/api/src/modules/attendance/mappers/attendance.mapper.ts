import type { AttendanceResponseDto } from '../dto/attendance-response.dto';
import type { AttendanceRecord } from '../interfaces/attendance-repository.interface';

/**
 * Maps persistence attendance records to API response DTOs.
 */
export class AttendanceMapper {
  static toResponse(record: AttendanceRecord): AttendanceResponseDto {
    return {
      id: record.id,
      organizationId: record.organizationId,
      liveSessionId: record.liveSessionId,
      studentId: record.studentId,
      status: record.status,
      markedAt: record.markedAt ? record.markedAt.toISOString() : null,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  static toResponseList(records: AttendanceRecord[]): AttendanceResponseDto[] {
    return records.map((record) => AttendanceMapper.toResponse(record));
  }
}
