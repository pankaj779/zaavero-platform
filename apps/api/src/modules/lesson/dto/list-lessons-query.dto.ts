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
  LESSON_CONTENT_TYPES,
  LESSON_DEFAULT_LIMIT,
  LESSON_DEFAULT_PAGE,
  LESSON_MAX_LIMIT,
  LESSON_SORT_FIELDS,
  type LessonContentTypeValue,
  type LessonSortField,
} from '../constants/lesson.constants';

export class ListLessonsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({ enum: LESSON_CONTENT_TYPES })
  @IsOptional()
  @IsIn([...LESSON_CONTENT_TYPES])
  contentType?: LessonContentTypeValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ default: LESSON_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = LESSON_DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: LESSON_DEFAULT_LIMIT,
    minimum: 1,
    maximum: LESSON_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LESSON_MAX_LIMIT)
  limit: number = LESSON_DEFAULT_LIMIT;

  @ApiPropertyOptional({ enum: LESSON_SORT_FIELDS, default: 'displayOrder' })
  @IsOptional()
  @IsIn([...LESSON_SORT_FIELDS])
  sortBy: LessonSortField = 'displayOrder';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'asc';
}
