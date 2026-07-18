import { describe, expect, it } from 'vitest';
import { mapBatchApiList, mapBatchApiToTeacherSummary, type BatchApiRecord } from './batch-mapper';
import { toBatchApiStatus, toBatchListSort } from '../teacher/batch-types';

const sampleRecord: BatchApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  courseId: '33333333-3333-4333-8333-333333333333',
  teacherId: '44444444-4444-4444-8444-444444444444',
  name: 'Weekend Cohort',
  status: 'ACTIVE',
  startDate: '2026-07-01T00:00:00.000Z',
  endDate: '2026-09-30T00:00:00.000Z',
  maxStudents: 24,
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-02-01T12:00:00.000Z',
};

describe('batch mapper', () => {
  it('maps NestJS batch records to teacher workspace DTOs', () => {
    const dto = mapBatchApiToTeacherSummary(sampleRecord);

    expect(dto.id).toBe(sampleRecord.id);
    expect(dto.name).toBe(sampleRecord.name);
    expect(dto.status).toBe('active');
    expect(dto.course.id).toBe(sampleRecord.courseId);
    expect(dto.course.title).toBe('Course');
    expect(dto.mentor.id).toBe(sampleRecord.teacherId);
    expect(dto.capacity).toBe(24);
    expect(dto.studentsEnrolled).toBe(0);
    expect(dto.nextLiveClass).toBeNull();
    expect(dto.progress.percentage).toBe(0);
  });

  it('maps CANCELLED to archived and null endDate/maxStudents', () => {
    const cancelled = mapBatchApiToTeacherSummary({
      ...sampleRecord,
      status: 'CANCELLED',
      endDate: null,
      maxStudents: null,
    });
    expect(cancelled.status).toBe('archived');
    expect(cancelled.endDate).toBe('');
    expect(cancelled.capacity).toBe(0);
  });

  it('enriches course title when lookup is provided', () => {
    const lookup = new Map([
      [
        sampleRecord.courseId,
        {
          id: sampleRecord.courseId,
          slug: 'graphology-foundations',
          title: 'Graphology Foundations',
        },
      ],
    ]);
    const dto = mapBatchApiToTeacherSummary(sampleRecord, lookup);
    expect(dto.course.title).toBe('Graphology Foundations');
    expect(dto.course.slug).toBe('graphology-foundations');
  });

  it('maps lists without leaking API-only fields', () => {
    const [first] = mapBatchApiList([sampleRecord]);
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('organizationId');
    expect(first).not.toHaveProperty('courseId');
    expect(first).not.toHaveProperty('maxStudents');
  });
});

describe('batch list query mappers', () => {
  it('maps UI sort options to API sort params', () => {
    expect(toBatchListSort('recently_updated')).toEqual({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
    expect(toBatchListSort('start_date')).toEqual({
      sortBy: 'startDate',
      sortOrder: 'asc',
    });
    expect(toBatchListSort('alphabetical')).toEqual({
      sortBy: 'name',
      sortOrder: 'asc',
    });
  });

  it('maps UI status filters to API status enums', () => {
    expect(toBatchApiStatus('all')).toBeUndefined();
    expect(toBatchApiStatus('active')).toBe('ACTIVE');
    expect(toBatchApiStatus('upcoming')).toBe('UPCOMING');
    expect(toBatchApiStatus('completed')).toBe('COMPLETED');
    expect(toBatchApiStatus('archived')).toBe('CANCELLED');
  });
});
