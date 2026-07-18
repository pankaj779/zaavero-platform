import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class OrganizationEmailQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

export class EmailListQueryDto extends OrganizationEmailQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class UpdateEmailPreferenceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  announcements?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  assignments?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  courses?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  payments?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  certificates?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  liveClasses?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  system?: boolean;

  @ApiPropertyOptional({ readOnly: true, default: true })
  @IsOptional()
  @IsBoolean()
  security?: boolean;

  @ApiPropertyOptional({ enum: ['IMMEDIATE', 'DAILY', 'WEEKLY', 'OFF'] })
  @IsOptional()
  @IsIn(['IMMEDIATE', 'DAILY', 'WEEKLY', 'OFF'])
  digestMode?: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'OFF';
}

export class CancelEmailDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RetryEmailDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;
}

export class PreviewEmailTemplateDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  key!: string;

  @ApiPropertyOptional({ default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale = 'en';

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  variables!: Record<string, unknown>;
}
