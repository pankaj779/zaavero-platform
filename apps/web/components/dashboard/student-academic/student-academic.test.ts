import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { StudentAssignmentDto, StudentLiveClassDto } from '../../../lib/student';
import type { StudentCertificateDto } from '../../../lib/student';
import {
  buildGoogleCalendarUrl,
  canDownloadCertificatePdf,
  canEditOwnSubmission,
  canJoinLiveClass,
  canPlayRecording,
  canShowCertificateQr,
  isSafeHttpUrl,
  isStudentVisibleAssignmentStatus,
} from './capabilities';
import {
  filterStudentAttendance,
  filterStudentLiveClasses,
  requireOrganizationId,
  toAttendanceApiStatus,
} from './filters';
import {
  assertNoGradingFields,
  buildCreateSubmissionPayload,
  buildUpdateOwnSubmissionPayload,
} from './mutations';

function liveSession(overrides: Partial<StudentLiveClassDto> = {}): StudentLiveClassDto {
  return {
    id: 'live-1',
    title: 'Session',
    description: 'Desc',
    course: { id: 'c1', slug: 'course', title: 'Course' },
    batch: { id: 'b1', name: 'Batch' },
    startsAt: '2026-07-20T10:00:00.000Z',
    endsAt: '2026-07-20T11:00:00.000Z',
    durationMinutes: 60,
    status: 'live',
    meeting: {
      provider: 'Zoom',
      status: 'ready',
      meetingUrl: 'https://zoom.example/j/1',
    },
    recordingUrl: null,
    attendanceStatus: null,
    capabilities: {
      joinMeeting: 'available',
      recordingPlayback: 'disabled',
      calendarSync: 'coming_soon',
      meetingProvisioning: 'coming_soon',
    },
    updatedAt: '2026-07-18T00:00:00.000Z',
    ...overrides,
  };
}

function assignment(overrides: Partial<StudentAssignmentDto> = {}): StudentAssignmentDto {
  return {
    id: 'asg-1',
    title: 'Homework',
    instructions: 'Do it',
    status: 'published',
    dueAt: '2026-07-25T00:00:00.000Z',
    maxScore: 10,
    course: { id: 'c1', slug: 'course', title: 'Course' },
    batch: { id: 'b1', name: 'Batch' },
    submission: null,
    capabilities: {
      fileUploads: 'coming_soon',
      plagiarismDetection: 'coming_soon',
      aiEvaluation: 'coming_soon',
    },
    updatedAt: '2026-07-18T00:00:00.000Z',
    ...overrides,
  };
}

function certificate(overrides: Partial<StudentCertificateDto> = {}): StudentCertificateDto {
  return {
    id: 'cert-1',
    student: { id: 's1', name: 'Student', email: 's@example.com' },
    course: { id: 'c1', slug: 'course', title: 'Course' },
    batch: { id: 'b1', name: 'Batch' },
    status: 'issued',
    issuedAt: '2026-07-01T00:00:00.000Z',
    certificateNumber: 'CERT-001',
    downloadUrl: null,
    qrImageUrl: null,
    verificationUrl: null,
    mentor: { id: 't1', name: 'Teacher' },
    futureFeatures: {
      pdfGeneration: 'coming_soon',
      qrGeneration: 'coming_soon',
      blockchainVerification: 'coming_soon',
      emailDelivery: 'coming_soon',
      downloads: 'coming_soon',
    },
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('student academic capabilities', () => {
  it('gates join on live/scheduled status plus safe meeting URL', () => {
    expect(canJoinLiveClass(liveSession())).toBe(true);
    expect(
      canJoinLiveClass(
        liveSession({
          status: 'completed',
        }),
      ),
    ).toBe(false);
    expect(
      canJoinLiveClass(
        liveSession({
          meeting: {
            provider: 'Zoom',
            status: 'ready',
            meetingUrl: 'javascript:alert(1)',
          },
        }),
      ),
    ).toBe(false);
    expect(
      canJoinLiveClass(
        liveSession({
          capabilities: {
            joinMeeting: 'disabled',
            recordingPlayback: 'disabled',
            calendarSync: 'coming_soon',
            meetingProvisioning: 'coming_soon',
          },
        }),
      ),
    ).toBe(false);
  });

  it('gates recording download on real safe URL', () => {
    expect(canPlayRecording(liveSession())).toBe(false);
    expect(
      canPlayRecording(
        liveSession({
          recordingUrl: 'https://cdn.example/rec.mp4',
          capabilities: {
            joinMeeting: 'available',
            recordingPlayback: 'available',
            calendarSync: 'coming_soon',
            meetingProvisioning: 'coming_soon',
          },
        }),
      ),
    ).toBe(true);
    expect(isSafeHttpUrl('data:text/html,hi')).toBe(false);
  });

  it('builds a real Google Calendar link without inventing meeting URLs', () => {
    const url = buildGoogleCalendarUrl(liveSession({ title: 'Live Graphology' }));
    expect(url.startsWith('https://calendar.google.com/calendar/render?')).toBe(true);
    expect(url).toContain('Live+Graphology');
  });

  it('allows submission edit only for new published or pending/returned own work', () => {
    expect(canEditOwnSubmission(assignment())).toBe(true);
    expect(canEditOwnSubmission(assignment({ status: 'closed' }))).toBe(false);
    expect(
      canEditOwnSubmission(
        assignment({
          submission: {
            id: 'sub-1',
            status: 'pending',
            content: 'draft',
            attachments: [],
            score: null,
            feedback: null,
            submittedAt: null,
            gradedAt: null,
            updatedAt: '2026-07-18T00:00:00.000Z',
          },
        }),
      ),
    ).toBe(true);
    expect(
      canEditOwnSubmission(
        assignment({
          submission: {
            id: 'sub-1',
            status: 'graded',
            content: 'done',
            attachments: [],
            score: 9,
            feedback: 'Good',
            submittedAt: '2026-07-10T00:00:00.000Z',
            gradedAt: '2026-07-11T00:00:00.000Z',
            updatedAt: '2026-07-11T00:00:00.000Z',
          },
        }),
      ),
    ).toBe(false);
  });

  it('keeps PDF and QR disabled without real URLs', () => {
    const cert = certificate();
    expect(canDownloadCertificatePdf(cert)).toBe(false);
    expect(canShowCertificateQr(cert)).toBe(false);
  });

  it('hides draft and archived assignments from student surfaces', () => {
    expect(isStudentVisibleAssignmentStatus('published')).toBe(true);
    expect(isStudentVisibleAssignmentStatus('closed')).toBe(true);
    expect(isStudentVisibleAssignmentStatus('draft')).toBe(false);
    expect(isStudentVisibleAssignmentStatus('archived')).toBe(false);
  });
});

describe('student academic mutations', () => {
  it('builds student submission payloads without grading fields', () => {
    const createPayload = buildCreateSubmissionPayload('  answer  ');
    expect(createPayload).toEqual({ content: 'answer', attachments: [] });
    expect(createPayload).not.toHaveProperty('score');
    expect(createPayload).not.toHaveProperty('feedback');

    const updatePayload = buildUpdateOwnSubmissionPayload('revised');
    expect(updatePayload).toEqual({ content: 'revised', status: 'SUBMITTED' });
    expect(updatePayload).not.toHaveProperty('score');
    expect(updatePayload).not.toHaveProperty('feedback');
    expect(() => {
      assertNoGradingFields(updatePayload);
    }).not.toThrow();
    expect(() => {
      assertNoGradingFields({ content: 'x', score: 10 });
    }).toThrow(/score/);
  });
});

describe('student academic filters and role-safe params', () => {
  it('requires organization id for scoped StudentApi usage', () => {
    expect(requireOrganizationId('org-1')).toBe('org-1');
    expect(() => {
      requireOrganizationId(null);
    }).toThrow(/Organization is required/);
  });

  it('maps attendance status filters for StudentApi.getAttendance', () => {
    expect(toAttendanceApiStatus('present')).toBe('PRESENT');
    expect(toAttendanceApiStatus('late')).toBe('LATE');
    expect(toAttendanceApiStatus('all')).toBeUndefined();
  });

  it('filters live schedule buckets honestly', () => {
    const now = new Date('2026-07-20T12:00:00.000Z');
    const sessions = [
      liveSession({
        id: 'today',
        status: 'scheduled',
        startsAt: '2026-07-20T15:00:00.000Z',
      }),
      liveSession({
        id: 'done',
        status: 'completed',
        startsAt: '2026-07-10T10:00:00.000Z',
      }),
    ];
    expect(
      filterStudentLiveClasses(sessions, '', 'all', 'today', undefined, now).map((s) => s.id),
    ).toEqual(['today']);
    expect(
      filterStudentLiveClasses(sessions, '', 'all', 'completed', undefined, now).map((s) => s.id),
    ).toEqual(['done']);
  });

  it('filters attendance by present/absent/late/excused', () => {
    const records = [
      {
        id: 'a1',
        liveSessionId: 'l1',
        status: 'present' as const,
        markedAt: '2026-07-10T10:00:00.000Z',
        notes: null,
        session: {
          id: 'l1',
          title: 'S1',
          startsAt: '2026-07-10T09:00:00.000Z',
          endsAt: null,
          course: { id: 'c1', slug: 'c', title: 'Course' },
          batch: { id: 'b1', name: 'Batch' },
        },
        updatedAt: '2026-07-10T10:00:00.000Z',
      },
      {
        id: 'a2',
        liveSessionId: 'l2',
        status: 'excused' as const,
        markedAt: '2026-07-11T10:00:00.000Z',
        notes: null,
        session: {
          id: 'l2',
          title: 'S2',
          startsAt: '2026-07-11T09:00:00.000Z',
          endsAt: null,
          course: { id: 'c1', slug: 'c', title: 'Course' },
          batch: { id: 'b1', name: 'Batch' },
        },
        updatedAt: '2026-07-11T10:00:00.000Z',
      },
    ];
    expect(filterStudentAttendance(records, '', 'excused').map((r) => r.id)).toEqual(['a2']);
  });
});

describe('student certificate verification contract', () => {
  it('does not invent verification or download URLs for CertificateApi verify flow', () => {
    const cert = certificate();
    expect(cert.verificationUrl).toBeNull();
    expect(cert.downloadUrl).toBeNull();
    expect(canShowCertificateQr(cert)).toBe(false);
    expect(canDownloadCertificatePdf(cert)).toBe(false);
  });
});

describe('student academic module API surface', () => {
  it('routes academic modules through StudentApi only (no org-wide domain clients)', () => {
    const sourceFiles = [
      'live-classes-view.tsx',
      'assignments-view.tsx',
      'attendance-view.tsx',
      'certificates-view.tsx',
    ];
    const dir = join(process.cwd(), 'components/dashboard/student-academic');

    for (const file of sourceFiles) {
      const source = readFileSync(join(dir, file), 'utf8');
      expect(source).toContain("from '../../../lib/api'");
      expect(source).toContain('StudentApi.');
      expect(source).not.toMatch(/\b(LiveSessionApi|AssignmentApi|AttendanceApi|CertificateApi)\./);
      expect(source).toContain('requireOrganizationId(primaryOrganizationId)');
    }
  });
});
