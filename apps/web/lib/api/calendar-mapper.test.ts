import { describe, expect, it } from 'vitest';
import {
  deriveCalendarEventStatus,
  deriveCalendarEventType,
  mapCalendarApiList,
  mapCalendarApiToTeacherEvent,
  type CalendarApiRecord,
} from './calendar-mapper';
import { getTeacherCalendarMonthRange, toCalendarListSort } from '../teacher/calendar-types';

const sampleRecord: CalendarApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  courseId: '33333333-3333-4333-8333-333333333333',
  batchId: '44444444-4444-4444-8444-444444444444',
  liveSessionId: null,
  assignmentId: null,
  title: 'Office block',
  description: 'Generic event',
  startsAt: '2026-07-17T14:00:00.000Z',
  endsAt: '2026-07-17T15:00:00.000Z',
  allDay: false,
  externalProvider: 'NONE',
  externalEventId: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z',
  deletedAt: null,
};

describe('calendar mapper', () => {
  it('maps NestJS calendar events to teacher DTOs with placeholders', () => {
    const now = new Date('2026-07-10T00:00:00.000Z');
    const dto = mapCalendarApiToTeacherEvent(sampleRecord, undefined, now);

    expect(dto.type).toBe('reminder');
    expect(dto.status).toBe('scheduled');
    expect(dto.course?.title).toBe('Course');
    expect(dto.batch?.name).toBe('Batch');
    expect(dto.mentor.name).toBe('Teacher');
    expect(dto.timezone).toBe('UTC');
    expect(dto.meetingUrl).toBeNull();
    expect(dto.location).toBeNull();
    expect(dto.futureFeatures.googleCalendar).toBe('coming_soon');
  });

  it('derives types from relationships and enriches lookups', () => {
    expect(
      deriveCalendarEventType({
        ...sampleRecord,
        liveSessionId: '55555555-5555-4555-8555-555555555555',
      }),
    ).toBe('live_class');
    expect(
      deriveCalendarEventType({
        ...sampleRecord,
        assignmentId: '66666666-6666-4666-8666-666666666666',
      }),
    ).toBe('assignment_due');
    expect(
      deriveCalendarEventType({
        ...sampleRecord,
        courseId: null,
        batchId: null,
        allDay: true,
      }),
    ).toBe('holiday');

    const courseId = '33333333-3333-4333-8333-333333333333';
    const batchId = '44444444-4444-4444-8444-444444444444';
    const dto = mapCalendarApiToTeacherEvent(sampleRecord, {
      courses: new Map([
        [
          courseId,
          {
            id: courseId,
            slug: 'foundations',
            title: 'Foundations',
          },
        ],
      ]),
      batches: new Map([[batchId, { id: batchId, name: 'Weekend Cohort' }]]),
    });

    expect(dto.course?.title).toBe('Foundations');
    expect(dto.course?.slug).toBe('foundations');
    expect(dto.batch?.name).toBe('Weekend Cohort');
  });

  it('derives completed status after end time and maps provider labels', () => {
    const past = deriveCalendarEventStatus(sampleRecord, new Date('2026-07-20T00:00:00.000Z'));
    expect(past).toBe('completed');

    const google = mapCalendarApiToTeacherEvent({
      ...sampleRecord,
      externalProvider: 'OUTLOOK',
    });
    expect(google.meetingProvider).toBe('Outlook');
  });

  it('maps lists and exposes month-range / sort helpers', () => {
    const items = mapCalendarApiList(
      [sampleRecord],
      undefined,
      new Date('2026-07-10T00:00:00.000Z'),
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(sampleRecord.id);

    const range = getTeacherCalendarMonthRange(2026, 7);
    expect(range.from.startsWith('2026-06')).toBe(true);
    expect(range.to.startsWith('2026-08') || range.to.startsWith('2026-07')).toBe(true);
    expect(toCalendarListSort()).toEqual({ sortBy: 'startsAt', sortOrder: 'asc' });
  });
});
