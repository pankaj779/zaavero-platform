import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  CERTIFICATE_DEFAULT_LIMIT,
  CERTIFICATE_DEFAULT_PAGE,
  CERTIFICATE_MAX_LIMIT,
  CERTIFICATE_SORT_FIELDS,
  CERTIFICATE_STATUSES,
  type CertificateSortField,
  type CertificateStatusValue,
} from '../constants/certificate.constants';

export class ListCertificatesQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ enum: CERTIFICATE_STATUSES })
  @IsOptional()
  @IsIn([...CERTIFICATE_STATUSES])
  status?: CertificateStatusValue;

  @ApiPropertyOptional({
    description: 'Case-insensitive search against certificate number',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ default: CERTIFICATE_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = CERTIFICATE_DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: CERTIFICATE_DEFAULT_LIMIT,
    minimum: 1,
    maximum: CERTIFICATE_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CERTIFICATE_MAX_LIMIT)
  limit: number = CERTIFICATE_DEFAULT_LIMIT;

  @ApiPropertyOptional({
    enum: CERTIFICATE_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn([...CERTIFICATE_SORT_FIELDS])
  sortBy: CertificateSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
