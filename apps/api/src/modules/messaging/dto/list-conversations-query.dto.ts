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
  CONVERSATION_SORT_FIELDS,
  CONVERSATION_TYPES,
  MESSAGING_DEFAULT_LIMIT,
  MESSAGING_DEFAULT_PAGE,
  MESSAGING_MAX_LIMIT,
  type ConversationSortField,
  type ConversationTypeValue,
} from '../constants/messaging.constants';

export class ListConversationsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ enum: CONVERSATION_TYPES })
  @IsOptional()
  @IsIn([...CONVERSATION_TYPES])
  type?: ConversationTypeValue;

  @ApiPropertyOptional({ description: 'Case-insensitive search against conversation title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ default: MESSAGING_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = MESSAGING_DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: MESSAGING_DEFAULT_LIMIT,
    minimum: 1,
    maximum: MESSAGING_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MESSAGING_MAX_LIMIT)
  limit: number = MESSAGING_DEFAULT_LIMIT;

  @ApiPropertyOptional({ enum: CONVERSATION_SORT_FIELDS, default: 'updatedAt' })
  @IsOptional()
  @IsIn([...CONVERSATION_SORT_FIELDS])
  sortBy: ConversationSortField = 'updatedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
