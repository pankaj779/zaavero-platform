import { describe, expect, it } from 'vitest';
import {
  mapEnrollmentApiList,
  mapEnrollmentApiToTeacherStudent,
  type EnrollmentApiRecord,
} from './enrollment-mapper';
import { toEnrollmentApiStatus, toEnrollmentListSort } from '../teacher/student-types';

const sampleRecord: EnrollmentApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  courseId: '33333333-3333-4333-8333-333333333333',
  batchId: '44444444-4444-4444-8444-444444444444',
  studentId: '55555555-5555-4555-8555-555555555555',
  status: 'ACTIVE',
  enrolledAt: '2026-07-01T09:00:00.000Z',
  completedAt: null,
  createdAt: '2026-07-01T09:00:00.000Z',
  updatedAt: '2026-07-15T10:00:00.000Z',
};

describe('enrollment mapper', () => {
  it('maps NestJS enrollment records to teacher student DTOs with placeholders', () => {
    const dto = mapEnrollmentApiToTeacherStudent(sampleRecord);

    expect(dto.id).toBe(sampleRecord.id);
    expect(dto.enrollmentStatus).toBe('active');
    expect(dto.joinedAt).toBe(sampleRecord.enrolledAt);
    expect(dto.avatarUrl).toBeNull();
    expect(dto.isAtRisk).toBe(false);
    expect(dto.progress).toEqual({
      percentage: 0,
      assignmentsCompleted: 0,
      assignmentsTotal: 0,
      attendancePercent: 0,
    });
    expect(dto.fullName).toBe('Student');
    expect(dto.course.title).toBe('Course');
    expect(dto.batch.name).toBe('Batch');
  });

  it('maps DROPPED/SUSPENDED to inactive and COMPLETED to completed', () => {
    expect(
      mapEnrollmentApiToTeacherStudent({ ...sampleRecord, status: 'DROPPED' }).enrollmentStatus,
    ).toBe('inactive');
    expect(
      mapEnrollmentApiToTeacherStudent({ ...sampleRecord, status: 'SUSPENDED' }).enrollmentStatus,
    ).toBe('inactive');
    expect(
      mapEnrollmentApiToTeacherStudent({ ...sampleRecord, status: 'COMPLETED' }).enrollmentStatus,
    ).toBe('completed');
  });

  it('enriches course and batch when lookups are provided', () => {
    const dto = mapEnrollmentApiToTeacherStudent(sampleRecord, {
      courses: new Map([
        [
          sampleRecord.courseId,
          {
            id: sampleRecord.courseId,
            slug: 'graphology-foundations',
            title: 'Graphology Foundations',
          },
        ],
      ]),
      batches: new Map([
        [sampleRecord.batchId, { id: sampleRecord.batchId, name: 'Weekend Cohort' }],
      ]),
    });

    expect(dto.course.title).toBe('Graphology Foundations');
    expect(dto.batch.name).toBe('Weekend Cohort');
  });

  it('maps lists without leaking API-only fields', () => {
    const [first] = mapEnrollmentApiList([sampleRecord]);
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('organizationId');
    expect(first).not.toHaveProperty('studentId');
    expect(first).not.toHaveProperty('courseId');
    expect(first).not.toHaveProperty('batchId');
  });
});

describe('enrollment list query mappers', () => {
  it('maps UI sort and status filters to API params', () => {
    expect(toEnrollmentListSort('recently_joined')).toEqual({
      sortBy: 'enrolledAt',
      sortOrder: 'desc',
    });
    expect(toEnrollmentApiStatus('all')).toBeUndefined();
    expect(toEnrollmentApiStatus('active')).toBe('ACTIVE');
    expect(toEnrollmentApiStatus('inactive')).toBe('DROPPED');
    expect(toEnrollmentApiStatus('completed')).toBe('COMPLETED');
  });
});
