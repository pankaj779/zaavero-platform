import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  MESSAGE_SORT_FIELDS,
  MESSAGING_DEFAULT_LIMIT,
  MESSAGING_DEFAULT_PAGE,
  MESSAGING_MAX_LIMIT,
  type MessageSortField,
} from '../constants/messaging.constants';

export class ListMessagesQueryDto {
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

  @ApiPropertyOptional({ enum: MESSAGE_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn([...MESSAGE_SORT_FIELDS])
  sortBy: MessageSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'asc';
}
