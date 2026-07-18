export const CERTIFICATE_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'issuedAt',
  'certificateNumber',
  'status',
] as const;

export type CertificateSortField = (typeof CERTIFICATE_SORT_FIELDS)[number];

export const CERTIFICATE_STATUSES = ['ELIGIBLE', 'PENDING', 'ISSUED', 'REVOKED'] as const;

export type CertificateStatusValue = (typeof CERTIFICATE_STATUSES)[number];

export const CERTIFICATE_DEFAULT_PAGE = 1;
export const CERTIFICATE_DEFAULT_LIMIT = 20;
export const CERTIFICATE_MAX_LIMIT = 100;

export const CERTIFICATE_CODE_MAX_RETRIES = 5;
