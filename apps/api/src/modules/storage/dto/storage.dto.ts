import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MEDIA_ENTITY_TYPES, type MediaEntityTypeValue } from '../constants/storage.constants';

export class StorageAssetContextDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ enum: MEDIA_ENTITY_TYPES })
  @IsIn(MEDIA_ENTITY_TYPES)
  entityType!: MediaEntityTypeValue;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 10 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class SignStorageUploadDto extends StorageAssetContextDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({ maxLength: 150, example: 'image/png' })
  @IsString()
  @MaxLength(150)
  @Matches(/^[\w.+-]+\/[\w.+-]+$/)
  mimeType!: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sizeBytes!: number;
}

export class ServerStorageUploadDto extends StorageAssetContextDto {}

export class FinalizeStorageUploadDto extends SignStorageUploadDto {
  @ApiProperty({ maxLength: 500, description: 'Provider public id returned by the direct upload' })
  @IsString()
  @MaxLength(500)
  publicId!: string;

  @ApiProperty({ description: 'SHA-256 checksum of the uploaded file, computed by the client' })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i)
  checksumSha256!: string;
}

export class ReplaceStorageAssetDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;
}

export class DeleteStorageAssetQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;
}

export class GetStorageAssetQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;
}

export class ListStorageAssetsQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiPropertyOptional({ enum: MEDIA_ENTITY_TYPES })
  @IsOptional()
  @IsIn(MEDIA_ENTITY_TYPES)
  entityType?: MediaEntityTypeValue;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

/** Only used to document Swagger for multipart uploads; the file arrives via Multer. */
export class MultipartUploadBodyDto extends ServerStorageUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file!: unknown;
}
