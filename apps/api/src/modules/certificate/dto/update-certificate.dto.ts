import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import {
  CERTIFICATE_STATUSES,
  type CertificateStatusValue,
} from '../constants/certificate.constants';

export class UpdateCertificateDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsUUID()
  templateId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsString()
  @MaxLength(2000)
  pdfUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'CERTIFICATE_QR MediaAsset id or secure URL',
  })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsString()
  @MaxLength(2000)
  qrImageUrl?: string | null;

  @ApiPropertyOptional({ enum: CERTIFICATE_STATUSES })
  @IsOptional()
  @IsIn(['ELIGIBLE', 'PENDING'])
  status?: Extract<CertificateStatusValue, 'ELIGIBLE' | 'PENDING'>;
}
