import { describe, expect, it } from 'vitest';
import {
  mapLessonApiList,
  mapLessonApiToTeacherSummary,
  type LessonApiRecord,
} from './lesson-mapper';
import {
  formatTeacherLessonDuration,
  toLessonApiContentType,
  toLessonListSort,
} from '../teacher/lesson-types';

const sampleRecord: LessonApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  moduleId: '44444444-4444-4444-8444-444444444444',
  title: 'Stroke Analysis',
  description: null,
  contentType: 'READING',
  contentUrl: null,
  durationSeconds: 90,
  displayOrder: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('lesson mapper', () => {
  it('maps NestJS lesson records to teacher workspace DTOs with placeholders', () => {
    const dto = mapLessonApiToTeacherSummary(sampleRecord);

    expect(dto.id).toBe(sampleRecord.id);
    expect(dto.title).toBe(sampleRecord.title);
    expect(dto.description).toBe('');
    expect(dto.contentType).toBe('reading');
    expect(dto.module.id).toBe(sampleRecord.moduleId);
    expect(dto.module.name).toBe('Module');
    expect(dto.course.title).toBe('Course');
    expect(dto.thumbnailUrl).toBeNull();
    expect(dto.attachmentCount).toBe(0);
    expect(dto.completionCount).toBe(0);
  });

  it('enriches course when lookup is provided', () => {
    const dto = mapLessonApiToTeacherSummary(sampleRecord, {
      course: {
        id: '33333333-3333-4333-8333-333333333333',
        slug: 'foundations',
        title: 'Foundations',
      },
    });
    expect(dto.course.title).toBe('Foundations');
    expect(dto.course.slug).toBe('foundations');
  });

  it('maps lists without leaking API-only fields', () => {
    const [first] = mapLessonApiList([sampleRecord]);
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('organizationId');
    expect(first).not.toHaveProperty('moduleId');
  });
});

describe('lesson list query mappers', () => {
  it('maps UI sort and content-type filters to API params', () => {
    expect(toLessonListSort('display_order')).toEqual({
      sortBy: 'displayOrder',
      sortOrder: 'asc',
    });
    expect(toLessonListSort('alphabetical')).toEqual({
      sortBy: 'title',
      sortOrder: 'asc',
    });
    expect(toLessonApiContentType('all')).toBeUndefined();
    expect(toLessonApiContentType('quiz')).toBe('QUIZ');
    expect(toLessonApiContentType('ai_tutor')).toBe('AI_TUTOR');
  });

  it('formats duration for display', () => {
    expect(formatTeacherLessonDuration(null)).toBe('Duration not set');
    expect(formatTeacherLessonDuration(45)).toBe('45s');
    expect(formatTeacherLessonDuration(120)).toBe('2 min');
  });
});
