import { describe, expect, it } from 'vitest';
import {
  studentCalendarPageCopy,
  studentMessagesPageCopy,
  studentNotificationsPageCopy,
} from '../../components/dashboard/engagement/copy';

describe('student engagement route wiring', () => {
  it('uses student language for calendar without Coming Soon framing', () => {
    expect(studentCalendarPageCopy.title).toBe('Calendar');
    expect(studentCalendarPageCopy.description.toLowerCase()).toContain('learning');
    expect(studentCalendarPageCopy.description).not.toMatch(/coming soon/i);
  });

  it('describes messaging as send/reply capable', () => {
    expect(studentMessagesPageCopy.title).toBe('Messages');
    expect(studentMessagesPageCopy.description.toLowerCase()).toMatch(/reply|read/);
    expect(studentMessagesPageCopy.description).not.toMatch(/coming soon/i);
    expect(studentMessagesPageCopy.description).not.toMatch(/will appear/i);
  });

  it('describes notifications with mark-read capability', () => {
    expect(studentNotificationsPageCopy.title).toBe('Notifications');
    expect(studentNotificationsPageCopy.description.toLowerCase()).toContain('mark read');
    expect(studentNotificationsPageCopy.description).not.toMatch(/coming soon/i);
  });
});
