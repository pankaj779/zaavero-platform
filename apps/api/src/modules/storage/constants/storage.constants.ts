export const MEDIA_ENTITY_TYPES = [
  'USER_AVATAR',
  'ORG_LOGO',
  'ORG_BRANDING',
  'COURSE_THUMBNAIL',
  'COURSE_BANNER',
  'LESSON_VIDEO',
  'LESSON_PDF',
  'LESSON_ZIP',
  'LESSON_ATTACHMENT',
  'ASSIGNMENT_ATTACHMENT',
  'SUBMISSION_ATTACHMENT',
  'CERTIFICATE_PDF',
  'CERTIFICATE_QR',
  'INVOICE_PDF',
  'PAYMENT_RECEIPT_PDF',
  'REFUND_RECEIPT_PDF',
  'MESSAGE_ATTACHMENT',
  'ANNOUNCEMENT_IMAGE',
  'CALENDAR_ATTACHMENT',
  'MEETING_RECORDING',
  'MEETING_RECORDING_THUMBNAIL',
  'OTHER',
] as const;

export type MediaEntityTypeValue = (typeof MEDIA_ENTITY_TYPES)[number];

export const MEDIA_RESOURCE_TYPES = ['IMAGE', 'VIDEO', 'RAW'] as const;
export type MediaResourceTypeValue = (typeof MEDIA_RESOURCE_TYPES)[number];

export const MEDIA_DELIVERY_TYPES = ['UPLOAD', 'PRIVATE', 'AUTHENTICATED'] as const;
export type MediaDeliveryTypeValue = (typeof MEDIA_DELIVERY_TYPES)[number];

export const DEFAULT_STORAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'text/plain',
  'application/zip',
] as const;

/** Extensions that are always rejected regardless of the allow list. */
export const DANGEROUS_FILE_EXTENSIONS = new Set([
  'bat',
  'cmd',
  'com',
  'dll',
  'exe',
  'htm',
  'html',
  'jar',
  'js',
  'mjs',
  'msi',
  'php',
  'ps1',
  'sh',
  // SVG can carry scripts and is served inline by CDNs.
  'svg',
  'vbs',
]);

export const STORAGE_AUDIT_ACTIONS = {
  upload: 'storage.asset.uploaded',
  replace: 'storage.asset.replaced',
  delete: 'storage.asset.deleted',
} as const;

export const STORAGE_AUDIT_ENTITY = 'MediaAsset';
