import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CERTIFICATE_VERIFICATION_STATUSES = ['VALID', 'REVOKED', 'NOT_FOUND'] as const;
export type CertificateVerificationStatus = (typeof CERTIFICATE_VERIFICATION_STATUSES)[number];

/**
 * Public verification payload. Deliberately scrubbed: display names and dates
 * only — never internal UUIDs or tenant identifiers.
 */
export class CertificateVerificationResponseDto {
  @ApiProperty({ enum: CERTIFICATE_VERIFICATION_STATUSES })
  status!: CertificateVerificationStatus;

  @ApiPropertyOptional({ nullable: true })
  certificateNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  verificationCode!: string | null;

  @ApiPropertyOptional({ nullable: true })
  studentName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  courseName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  organizationName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  organizationLogoUrl!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  issuedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  revokedAt!: string | null;
}
