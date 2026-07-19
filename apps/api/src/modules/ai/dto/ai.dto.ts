import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AI_FEATURES, AI_FEEDBACK_RATINGS } from '../constants/ai.constants';

export class OrganizationAIQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;
}

export class AIListQueryDto extends OrganizationAIQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class AIConversationListQueryDto extends AIListQueryDto {
  @ApiPropertyOptional({ enum: AI_FEATURES })
  @IsOptional()
  @IsEnum(AI_FEATURES)
  feature?: (typeof AI_FEATURES)[number];
}

export class CreateAIConversationDto extends OrganizationAIQueryDto {
  @ApiProperty({ enum: AI_FEATURES })
  @IsEnum(AI_FEATURES)
  feature!: (typeof AI_FEATURES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;
}

export class UpdateAIConversationDto extends OrganizationAIQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}

export class AIChatStreamDto extends OrganizationAIQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiProperty({ enum: AI_FEATURES })
  @IsEnum(AI_FEATURES)
  feature!: (typeof AI_FEATURES)[number];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  message!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentMessageId?: string;
}

export class AIGenerateDto extends OrganizationAIQueryDto {
  @ApiProperty({ enum: AI_FEATURES })
  @IsEnum(AI_FEATURES)
  feature!: (typeof AI_FEATURES)[number];

  @ApiProperty()
  @IsObject()
  variables!: Record<string, unknown>;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}

export class AISemanticSearchDto extends OrganizationAIQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  query!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lessonId?: string;
}

export class IndexAIDocumentDto extends OrganizationAIQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  mediaAssetId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}

export class AIFeedbackDto extends OrganizationAIQueryDto {
  @ApiProperty({ enum: AI_FEEDBACK_RATINGS })
  @IsEnum(AI_FEEDBACK_RATINGS)
  rating!: (typeof AI_FEEDBACK_RATINGS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class AIAdminUsageQueryDto extends OrganizationAIQueryDto {
  @ApiPropertyOptional({ default: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days = 30;
}
