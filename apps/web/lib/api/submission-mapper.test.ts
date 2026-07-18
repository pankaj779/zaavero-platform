import { describe, expect, it } from 'vitest';
import {
  mapSubmissionApiList,
  mapSubmissionApiToTeacherSummary,
  type SubmissionApiRecord,
} from './submission-mapper';
import { toSubmissionApiStatus, toSubmissionListSort } from '../teacher/submission-types';

const sampleRecord: SubmissionApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  assignmentId: '55555555-5555-4555-8555-555555555555',
  studentId: '66666666-6666-4666-8666-666666666666',
  status: 'LATE',
  content: 'Late work',
  attachments: ['https://example.com/file.pdf'],
  score: null,
  feedback: null,
  submittedAt: '2026-07-22T10:00:00.000Z',
  gradedAt: null,
  gradedById: null,
  createdAt: '2026-07-20T09:00:00.000Z',
  updatedAt: '2026-07-22T10:00:00.000Z',
};

describe('submission mapper', () => {
  it('maps NestJS submissions to teacher DTOs with placeholders', () => {
    const dto = mapSubmissionApiToTeacherSummary(sampleRecord);

    expect(dto.status).toBe('late');
    expect(dto.student.fullName).toBe('Student');
    expect(dto.student.avatarUrl).toBeNull();
    expect(dto.assignment.title).toBe('Assignment');
    expect(dto.assignment.course.title).toBe('Course');
    expect(dto.attachments[0]?.kind).toBe('document');
    expect(dto.grader).toBeNull();
  });

  it('enriches assignment when lookups are provided', () => {
    const dto = mapSubmissionApiToTeacherSummary(sampleRecord, {
      assignments: new Map([
        [
          sampleRecord.assignmentId,
          {
            id: sampleRecord.assignmentId,
            title: 'Foundations Essay',
            courseId: '33333333-3333-4333-8333-333333333333',
            courseSlug: 'foundations',
            courseTitle: 'Foundations',
            maxScore: 100,
          },
        ],
      ]),
    });

    expect(dto.assignment.title).toBe('Foundations Essay');
    expect(dto.assignment.course.title).toBe('Foundations');
    expect(dto.assignment.maxScore).toBe(100);
  });

  it('maps lists without leaking API-only fields', () => {
    const [first] = mapSubmissionApiList([sampleRecord]);
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('organizationId');
    expect(first).not.toHaveProperty('assignmentId');
    expect(first).not.toHaveProperty('studentId');
    expect(first).not.toHaveProperty('gradedById');
    expect(first).not.toHaveProperty('createdAt');
  });
});

describe('submission query mappers', () => {
  it('maps UI filters to API enums', () => {
    expect(toSubmissionApiStatus('all')).toBeUndefined();
    expect(toSubmissionApiStatus('graded')).toBe('GRADED');
    expect(toSubmissionListSort('submitted_at')).toEqual({
      sortBy: 'submittedAt',
      sortOrder: 'asc',
    });
    expect(toSubmissionListSort('score')).toEqual({
      sortBy: 'score',
      sortOrder: 'desc',
    });
  });
});
