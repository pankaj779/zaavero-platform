import { describe, expect, it } from 'vitest';
import {
  mapCourseApiList,
  mapCourseApiToTeacherSummary,
  type CourseApiRecord,
} from './course-mapper';
import { toCourseApiStatus, toCourseListSort } from '../teacher/course-types';

const sampleRecord: CourseApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  teacherId: '33333333-3333-4333-8333-333333333333',
  title: 'Introduction to Graphology',
  slug: 'intro-graphology',
  description: 'Foundations of handwriting analysis.',
  difficulty: 'BEGINNER',
  status: 'PUBLISHED',
  language: 'en',
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-02-01T12:00:00.000Z',
};

describe('course mapper', () => {
  it('maps NestJS course records to teacher workspace DTOs', () => {
    const dto = mapCourseApiToTeacherSummary(sampleRecord);

    expect(dto.id).toBe(sampleRecord.id);
    expect(dto.slug).toBe(sampleRecord.slug);
    expect(dto.title).toBe(sampleRecord.title);
    expect(dto.description).toBe(sampleRecord.description);
    expect(dto.status).toBe('published');
    expect(dto.isPublished).toBe(true);
    expect(dto.media.thumbnailUrl).toBeNull();
    expect(dto.counts).toEqual({
      batches: 0,
      students: 0,
      lessons: 0,
      assignments: 0,
    });
  });

  it('normalizes draft/archived status and null description', () => {
    const draft = mapCourseApiToTeacherSummary({
      ...sampleRecord,
      status: 'DRAFT',
      description: null,
    });
    expect(draft.status).toBe('draft');
    expect(draft.isPublished).toBe(false);
    expect(draft.description).toBe('');

    const archived = mapCourseApiToTeacherSummary({
      ...sampleRecord,
      status: 'ARCHIVED',
    });
    expect(archived.status).toBe('archived');
  });

  it('maps lists without leaking API-only fields', () => {
    const [first] = mapCourseApiList([sampleRecord]);
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('organizationId');
    expect(first).not.toHaveProperty('teacherId');
    expect(first).not.toHaveProperty('difficulty');
  });
});

describe('course list query mappers', () => {
  it('maps UI sort options to API sort params', () => {
    expect(toCourseListSort('newest')).toEqual({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(toCourseListSort('recently_updated')).toEqual({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
    expect(toCourseListSort('alphabetical')).toEqual({
      sortBy: 'title',
      sortOrder: 'asc',
    });
  });

  it('maps UI status filters to API status enums', () => {
    expect(toCourseApiStatus('all')).toBeUndefined();
    expect(toCourseApiStatus('draft')).toBe('DRAFT');
    expect(toCourseApiStatus('published')).toBe('PUBLISHED');
    expect(toCourseApiStatus('archived')).toBe('ARCHIVED');
  });
});
