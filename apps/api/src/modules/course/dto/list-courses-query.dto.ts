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
  COURSE_DEFAULT_LIMIT,
  COURSE_DEFAULT_PAGE,
  COURSE_DIFFICULTIES,
  COURSE_MAX_LIMIT,
  COURSE_SORT_FIELDS,
  COURSE_STATUSES,
  type CourseDifficultyValue,
  type CourseSortField,
  type CourseStatusValue,
} from '../constants/course.constants';

export class ListCoursesQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Required when the user belongs to multiple organizations',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive search against title and description',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: COURSE_STATUSES })
  @IsOptional()
  @IsIn([...COURSE_STATUSES])
  status?: CourseStatusValue;

  @ApiPropertyOptional({ enum: COURSE_DIFFICULTIES })
  @IsOptional()
  @IsIn([...COURSE_DIFFICULTIES])
  difficulty?: CourseDifficultyValue;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(16)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  language?: string;

  @ApiPropertyOptional({ default: COURSE_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = COURSE_DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: COURSE_DEFAULT_LIMIT,
    minimum: 1,
    maximum: COURSE_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(COURSE_MAX_LIMIT)
  limit: number = COURSE_DEFAULT_LIMIT;

  @ApiPropertyOptional({
    enum: COURSE_SORT_FIELDS,
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn([...COURSE_SORT_FIELDS])
  sortBy: CourseSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
