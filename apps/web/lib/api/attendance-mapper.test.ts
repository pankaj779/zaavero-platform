import { describe, expect, it } from 'vitest';
import {
  mapAttendanceApiList,
  mapAttendanceApiToRecordDto,
  mapAttendancesToSessionDtos,
  type AttendanceApiRecord,
} from './attendance-mapper';
import { toAttendanceApiMarkStatus, toAttendanceListSort } from '../teacher/attendance-types';

const sampleRecord: AttendanceApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  liveSessionId: '55555555-5555-4555-8555-555555555555',
  studentId: '66666666-6666-4666-8666-666666666666',
  status: 'PRESENT',
  markedAt: '2026-07-01T10:05:00.000Z',
  notes: null,
  createdAt: '2026-07-01T10:05:00.000Z',
  updatedAt: '2026-07-01T10:05:00.000Z',
};

describe('attendance mapper', () => {
  it('maps NestJS attendance rows to roster DTOs with student placeholders', () => {
    const dto = mapAttendanceApiToRecordDto(sampleRecord);
    expect(dto.studentId).toBe(sampleRecord.studentId);
    expect(dto.studentName).toBe('Student');
    expect(dto.initials).toBe('ST');
    expect(dto.status).toBe('present');
  });

  it('maps LATE to present and EXCUSED to absent', () => {
    expect(mapAttendanceApiToRecordDto({ ...sampleRecord, status: 'LATE' }).status).toBe('present');
    expect(mapAttendanceApiToRecordDto({ ...sampleRecord, status: 'EXCUSED' }).status).toBe(
      'absent',
    );
  });

  it('groups records into sessions and applies live-session lookups', () => {
    const sessions = mapAttendancesToSessionDtos(
      [
        sampleRecord,
        {
          ...sampleRecord,
          id: '77777777-7777-4777-8777-777777777777',
          studentId: '88888888-8888-4888-8888-888888888888',
          status: 'ABSENT',
        },
      ],
      new Map([
        [
          sampleRecord.liveSessionId,
          {
            id: sampleRecord.liveSessionId,
            title: 'Foundations Live',
            status: 'completed',
            startsAt: '2026-07-01T10:00:00.000Z',
            endsAt: '2026-07-01T11:00:00.000Z',
            updatedAt: '2026-07-01T12:00:00.000Z',
            batchId: '44444444-4444-4444-8444-444444444444',
            courseId: '33333333-3333-4333-8333-333333333333',
            courseSlug: 'foundations',
            courseTitle: 'Foundations',
            batchName: 'Weekend Cohort',
            studentsEnrolled: 12,
            durationMinutes: 60,
          },
        ],
      ]),
    );

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.title).toBe('Foundations Live');
    expect(sessions[0]?.course.title).toBe('Foundations');
    expect(sessions[0]?.counts.attendancePercent).toBe(50);
    expect(sessions[0]?.meetingUrl).toBeNull();
    expect(sessions[0]?.meetingProvider).toBeNull();
    expect(sessions[0]?.mentor.name).toBe('Teacher');
  });

  it('maps lists without leaking API-only fields', () => {
    const [first] = mapAttendanceApiList([sampleRecord]);
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('organizationId');
    expect(first).not.toHaveProperty('liveSessionId');
    expect(first).not.toHaveProperty('markedAt');
    expect(first).not.toHaveProperty('notes');
  });
});

describe('attendance query mappers', () => {
  it('maps UI filters to API enums', () => {
    expect(toAttendanceApiMarkStatus('all')).toBeUndefined();
    expect(toAttendanceApiMarkStatus('present')).toBe('PRESENT');
    expect(toAttendanceListSort('session_date')).toEqual({
      sortBy: 'markedAt',
      sortOrder: 'desc',
    });
    expect(toAttendanceListSort('alphabetical')).toEqual({
      sortBy: 'status',
      sortOrder: 'asc',
    });
  });
});
