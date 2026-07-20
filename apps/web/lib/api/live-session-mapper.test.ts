import { describe, expect, it } from 'vitest';
import {
  mapLiveSessionApiList,
  mapLiveSessionApiToTeacherDto,
  type LiveSessionApiRecord,
} from './live-session-mapper';
import {
  toLiveSessionApiProvider,
  toLiveSessionApiStatus,
  toLiveSessionListSort,
} from '../teacher/live-session-types';

const sampleRecord: LiveSessionApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  batchId: '44444444-4444-4444-8444-444444444444',
  title: 'Foundations Live',
  description: null,
  status: 'COMPLETED',
  meetingProvider: 'CUSTOM',
  meetingUrl: 'https://example.com/meet',
  recordingUrl: 'https://example.com/rec',
  startsAt: '2026-07-01T10:00:00.000Z',
  endsAt: '2026-07-01T11:30:00.000Z',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-07-01T12:00:00.000Z',
};

describe('live-session mapper', () => {
  it('maps NestJS live sessions to teacher DTOs with placeholders', () => {
    const dto = mapLiveSessionApiToTeacherDto(sampleRecord);

    expect(dto.status).toBe('completed');
    expect(dto.meeting.provider).toBe('Microsoft Teams');
    expect(dto.meeting.status).toBe('ended');
    expect(dto.meeting.meetingUrl).toBe('https://example.com/meet');
    expect(dto.durationMinutes).toBe(90);
    expect(dto.mentor.name).toBe('Teacher');
    expect(dto.attendance.attendancePercent).toBeNull();
    expect(dto.course.title).toBe('Course');
    expect(dto.batch.name).toBe('Batch');
  });

  it('enriches course and batch when lookups are provided', () => {
    const dto = mapLiveSessionApiToTeacherDto(sampleRecord, {
      batches: new Map([
        [
          sampleRecord.batchId,
          {
            id: sampleRecord.batchId,
            name: 'Weekend Cohort',
            courseId: '33333333-3333-4333-8333-333333333333',
            studentsEnrolled: 18,
          },
        ],
      ]),
      courses: new Map([
        [
          '33333333-3333-4333-8333-333333333333',
          {
            id: '33333333-3333-4333-8333-333333333333',
            slug: 'foundations',
            title: 'Foundations',
          },
        ],
      ]),
    });

    expect(dto.batch.name).toBe('Weekend Cohort');
    expect(dto.course.title).toBe('Foundations');
    expect(dto.attendance.totalStudents).toBe(18);
  });

  it('maps lists without leaking API-only fields', () => {
    const [first] = mapLiveSessionApiList([sampleRecord]);
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('organizationId');
    expect(first).not.toHaveProperty('batchId');
    expect(first).not.toHaveProperty('recordingUrl');
  });
});

describe('live-session query mappers', () => {
  it('maps UI filters to API enums', () => {
    expect(toLiveSessionApiStatus('scheduled')).toBe('SCHEDULED');
    expect(toLiveSessionApiProvider('Google Meet')).toBe('GOOGLE_MEET');
    expect(toLiveSessionListSort('upcoming')).toEqual({
      sortBy: 'startsAt',
      sortOrder: 'asc',
    });
  });
});
