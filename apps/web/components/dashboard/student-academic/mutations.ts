import type { UpdateSubmissionInput } from '../../../lib/api';

/**
 * Student submission payloads — content/status only.
 * Never include score or feedback (teacher grading fields).
 */
export function buildCreateSubmissionPayload(
  content: string,
  attachments: string[] = [],
): {
  content: string;
  attachments: string[];
} {
  return {
    content: content.trim(),
    attachments,
  };
}

export function buildUpdateOwnSubmissionPayload(
  content: string,
  attachments?: string[],
): UpdateSubmissionInput {
  return {
    content: content.trim(),
    ...(attachments ? { attachments } : {}),
    status: 'SUBMITTED',
  };
}

export function assertNoGradingFields(input: UpdateSubmissionInput): void {
  if ('score' in input && input.score !== undefined) {
    throw new Error('Students must not send grading score fields.');
  }
  if ('feedback' in input && input.feedback !== undefined) {
    throw new Error('Students must not send grading feedback fields.');
  }
}
