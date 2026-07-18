import type { StudentAssignmentDto } from '../../../lib/student';
import type { StudentLiveClassDto } from '../../../lib/student';
import type { StudentCertificateDto } from '../../../lib/student';

/** True when the URL is a real http(s) link (blocks javascript:/data: etc.). */
export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url || url.trim().length === 0) {
    return false;
  }
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Join is allowed only for live/scheduled sessions with a safe meeting URL. */
export function canJoinLiveClass(session: StudentLiveClassDto): boolean {
  if (session.status !== 'live' && session.status !== 'scheduled') {
    return false;
  }
  if (session.capabilities.joinMeeting !== 'available') {
    return false;
  }
  return isSafeHttpUrl(session.meeting.meetingUrl);
}

/** Recording playback requires a real safe recording URL. */
export function canPlayRecording(session: StudentLiveClassDto): boolean {
  if (session.capabilities.recordingPlayback !== 'available') {
    return false;
  }
  return isSafeHttpUrl(session.recordingUrl);
}

/** Google Calendar deep-link (not OAuth sync). */
export function buildGoogleCalendarUrl(session: StudentLiveClassDto): string {
  const start = toGoogleCalendarStamp(session.startsAt);
  const end = toGoogleCalendarStamp(
    session.endsAt ??
      new Date(
        new Date(session.startsAt).getTime() + session.durationMinutes * 60_000,
      ).toISOString(),
  );
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${start}/${end}`,
    details: session.description || `${session.course.title} · ${session.batch.name}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function toGoogleCalendarStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * New submission when published and none exists.
 * Update when own submission is pending or returned (never graded fields).
 */
export function canEditOwnSubmission(assignment: StudentAssignmentDto): boolean {
  const submission = assignment.submission;
  if (!submission) {
    return assignment.status === 'published';
  }
  return submission.status === 'pending' || submission.status === 'returned';
}

/** PDF download only when a real safe download URL exists (never invent one). */
export function canDownloadCertificatePdf(
  certificate: Pick<StudentCertificateDto, 'downloadUrl'>,
): boolean {
  const url = certificate.downloadUrl as string | null;
  return isSafeHttpUrl(url);
}

/** QR / public verify URL only when a real safe verification URL exists. */
export function canShowCertificateQr(
  certificate: Pick<StudentCertificateDto, 'verificationUrl'>,
): boolean {
  const url = certificate.verificationUrl as string | null;
  return isSafeHttpUrl(url);
}

/** Student assignment list must never surface draft/archived items. */
export function isStudentVisibleAssignmentStatus(status: StudentAssignmentDto['status']): boolean {
  return status === 'published' || status === 'closed';
}
