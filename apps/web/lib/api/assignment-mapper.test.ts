import { describe, expect, it } from 'vitest';
import {
  mapAssignmentApiList,
  mapAssignmentApiToTeacherSummary,
  type AssignmentApiRecord,
} from './assignment-mapper';
import { toAssignmentApiStatus, toAssignmentListSort } from '../teacher/assignment-types';

const sampleRecord: AssignmentApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  courseId: '33333333-3333-4333-8333-333333333333',
  batchId: '44444444-4444-4444-8444-444444444444',
  title: 'Foundations Essay',
  instructions: null,
  status: 'PUBLISHED',
  maxScore: 100,
  dueAt: '2026-08-01T18:00:00.000Z',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z',
  deletedAt: null,
};

describe('assignment mapper', () => {
  it('maps NestJS assignments to teacher DTOs with placeholders', () => {
    const dto = mapAssignmentApiToTeacherSummary(sampleRecord);

    expect(dto.status).toBe('published');
    expect(dto.course.title).toBe('Course');
    expect(dto.batches).toHaveLength(1);
    expect(dto.batches[0]?.name).toBe('Batch');
    expect(dto.grading.maxScore).toBe(100);
    expect(dto.grading.awaitingReview).toBe(0);
    expect(dto.submissions.submitted).toBe(0);
    expect(dto.submissions.submissionRate).toBeNull();
    expect(dto.attachments).toHaveLength(0);
    expect(dto.integrations.plagiarismDetection).toBe('coming_soon');
    expect(dto.timeline[0]?.id).toBe('created');
  });

  it('enriches course and batch when lookups are provided', () => {
    const batchId = '44444444-4444-4444-8444-444444444444';
    const dto = mapAssignmentApiToTeacherSummary(sampleRecord, {
      courses: new Map([
        [
          sampleRecord.courseId,
          {
            id: sampleRecord.courseId,
            slug: 'foundations',
            title: 'Foundations',
          },
        ],
      ]),
      batches: new Map([
        [
          batchId,
          {
            id: batchId,
            name: 'Weekend Cohort',
            studentsEnrolled: 18,
          },
        ],
      ]),
    });

    expect(dto.course.title).toBe('Foundations');
    expect(dto.course.slug).toBe('foundations');
    expect(dto.batches[0]?.name).toBe('Weekend Cohort');
    expect(dto.batches[0]?.studentsEnrolled).toBe(18);
    expect(dto.submissions.totalStudents).toBe(18);
    expect(dto.submissions.submissionRate).toBe(0);
  });

  it('maps draft submission rate to null and lists without leaking API-only fields', () => {
    const draft = mapAssignmentApiToTeacherSummary({
      ...sampleRecord,
      status: 'DRAFT',
      batchId: null,
    });
    expect(draft.status).toBe('draft');
    expect(draft.submissions.submissionRate).toBeNull();
    expect(draft.batches).toEqual([]);

    const [first] = mapAssignmentApiList([sampleRecord]);
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('organizationId');
    expect(first).not.toHaveProperty('courseId');
    expect(first).not.toHaveProperty('batchId');
    expect(first).not.toHaveProperty('instructions');
    expect(first).not.toHaveProperty('deletedAt');
  });
});

describe('assignment query mappers', () => {
  it('maps UI filters to API enums', () => {
    expect(toAssignmentApiStatus('all')).toBeUndefined();
    expect(toAssignmentApiStatus('published')).toBe('PUBLISHED');
    expect(toAssignmentListSort('due_date')).toEqual({
      sortBy: 'dueAt',
      sortOrder: 'asc',
    });
    expect(toAssignmentListSort('alphabetical')).toEqual({
      sortBy: 'title',
      sortOrder: 'asc',
    });
  });
});
