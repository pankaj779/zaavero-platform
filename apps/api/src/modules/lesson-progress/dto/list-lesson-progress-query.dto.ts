import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  LESSON_PROGRESS_DEFAULT_LIMIT,
  LESSON_PROGRESS_DEFAULT_PAGE,
  LESSON_PROGRESS_MAX_LIMIT,
  LESSON_PROGRESS_SORT_FIELDS,
  LESSON_PROGRESS_STATUSES,
  type LessonProgressSortField,
  type LessonProgressStatusValue,
} from '../constants/lesson-progress.constants';

export class ListLessonProgressQueryDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() organizationId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() lessonId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() studentId?: string;
  @ApiPropertyOptional({ enum: LESSON_PROGRESS_STATUSES })
  @IsOptional()
  @IsIn([...LESSON_PROGRESS_STATUSES])
  status?: LessonProgressStatusValue;
  @ApiPropertyOptional({ default: LESSON_PROGRESS_DEFAULT_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = LESSON_PROGRESS_DEFAULT_PAGE;
  @ApiPropertyOptional({
    default: LESSON_PROGRESS_DEFAULT_LIMIT,
    maximum: LESSON_PROGRESS_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LESSON_PROGRESS_MAX_LIMIT)
  limit: number = LESSON_PROGRESS_DEFAULT_LIMIT;
  @ApiPropertyOptional({ enum: LESSON_PROGRESS_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn([...LESSON_PROGRESS_SORT_FIELDS])
  sortBy: LessonProgressSortField = 'createdAt';
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
