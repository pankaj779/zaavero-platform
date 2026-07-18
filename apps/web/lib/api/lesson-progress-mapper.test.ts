import { describe, expect, it } from 'vitest';
import {
  mapLessonProgressApiList,
  mapLessonProgressApiToDto,
  mapLessonProgressStatus,
  type LessonProgressApiRecord,
} from './lesson-progress-mapper';

const sampleRecord: LessonProgressApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  lessonId: '33333333-3333-4333-8333-333333333333',
  studentId: '66666666-6666-4666-8666-666666666666',
  status: 'IN_PROGRESS',
  progressPercent: 40,
  lastPositionSeconds: 120,
  completedAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-10T09:00:00.000Z',
};

describe('lesson-progress mapper', () => {
  it('maps status values', () => {
    expect(mapLessonProgressStatus('NOT_STARTED')).toBe('not_started');
    expect(mapLessonProgressStatus('IN_PROGRESS')).toBe('in_progress');
    expect(mapLessonProgressStatus('COMPLETED')).toBe('completed');
  });

  it('maps NestJS lesson-progress records to student DTOs', () => {
    const dto = mapLessonProgressApiToDto(sampleRecord);

    expect(dto.id).toBe(sampleRecord.id);
    expect(dto.lessonId).toBe(sampleRecord.lessonId);
    expect(dto.status).toBe('in_progress');
    expect(dto.progressPercent).toBe(40);
    expect(dto.lastPositionSeconds).toBe(120);
    expect(dto.completedAt).toBeNull();
  });

  it('maps lists', () => {
    expect(mapLessonProgressApiList([sampleRecord])).toHaveLength(1);
  });
});
