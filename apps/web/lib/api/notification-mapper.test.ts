import { describe, expect, it } from 'vitest';
import {
  mapNotificationApiList,
  mapNotificationApiToTeacherDto,
  mapNotificationType,
  type NotificationApiRecord,
} from './notification-mapper';

const sampleRecord: NotificationApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  userId: '33333333-3333-4333-8333-333333333333',
  channel: 'IN_APP',
  type: 'SUBMISSION_RECEIVED',
  title: 'Submission received',
  body: 'A learner submitted an assignment.',
  data: { assignmentId: '44444444-4444-4444-8444-444444444444' },
  readAt: null,
  createdAt: '2026-07-18T08:00:00.000Z',
  updatedAt: '2026-07-18T08:00:00.000Z',
};

describe('notification mapper', () => {
  it('maps backend records into teacher DTOs without exposing untrusted data', () => {
    const dto = mapNotificationApiToTeacherDto(sampleRecord);

    expect(dto).toMatchObject({
      id: sampleRecord.id,
      userId: sampleRecord.userId,
      title: 'Submission received',
      message: 'A learner submitted an assignment.',
      type: 'assignment',
      priority: 'medium',
      readAt: null,
      archivedAt: null,
      actionLabel: null,
      actionUrl: null,
      icon: 'clipboard',
      relatedFeatureLabel: 'Assignment',
    });
    expect(dto.futureFeatures.deepLinkingEnabled).toBe(false);
    expect(dto).not.toHaveProperty('organizationId');
    expect(dto).not.toHaveProperty('data');
  });

  it('maps known backend type variants and safely falls back to system', () => {
    expect(mapNotificationType('LIVE_SESSION')).toBe('live_class');
    expect(mapNotificationType('certificate-issued')).toBe('certificate');
    expect(mapNotificationType('announcement')).toBe('announcement');
    expect(mapNotificationType('custom_backend_event')).toBe('system');
  });

  it('maps nullable bodies and lists', () => {
    const items = mapNotificationApiList([
      sampleRecord,
      {
        ...sampleRecord,
        id: '55555555-5555-4555-8555-555555555555',
        type: 'PAYMENT',
        body: null,
        readAt: '2026-07-18T09:00:00.000Z',
      },
    ]);

    expect(items).toHaveLength(2);
    expect(items[1]).toMatchObject({
      message: '',
      type: 'payment',
      icon: 'creditCard',
      readAt: '2026-07-18T09:00:00.000Z',
    });
  });
});
