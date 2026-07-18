import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUrl, IsUUID, MaxLength, ValidateIf } from 'class-validator';
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
  @IsUrl()
  @MaxLength(2000)
  pdfUrl?: string | null;

  @ApiPropertyOptional({ enum: CERTIFICATE_STATUSES })
  @IsOptional()
  @IsIn(['ELIGIBLE', 'PENDING'])
  status?: Extract<CertificateStatusValue, 'ELIGIBLE' | 'PENDING'>;
}
