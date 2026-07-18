import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CERTIFICATE_STATUSES,
  type CertificateStatusValue,
} from '../constants/certificate.constants';

export class CertificateResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  batchId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  templateId!: string | null;

  @ApiProperty({ enum: CERTIFICATE_STATUSES })
  status!: CertificateStatusValue;

  @ApiProperty()
  certificateNumber!: string;

  @ApiProperty()
  verificationCode!: string;

  @ApiPropertyOptional({ nullable: true })
  pdfUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  qrImageUrl!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  issuedAt!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  revokedAt!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class CertificateListMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedCertificatesResponseDto {
  @ApiProperty({ type: [CertificateResponseDto] })
  items!: CertificateResponseDto[];

  @ApiProperty({ type: CertificateListMetaDto })
  meta!: CertificateListMetaDto;
}
