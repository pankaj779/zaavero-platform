import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import {
  COURSE_DIFFICULTIES,
  COURSE_SLUG_PATTERN,
  COURSE_STATUSES,
  type CourseDifficultyValue,
  type CourseStatusValue,
} from '../constants/course.constants';

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Introduction to Handwriting Analysis' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({
    example: 'intro-handwriting-analysis',
    description: 'URL-safe slug, unique within the organization',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(COURSE_SLUG_PATTERN, {
    message: 'slug must be lowercase kebab-case (a-z, 0-9, hyphens)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug?: string;

  @ApiPropertyOptional({ example: 'Updated course description.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  })
  description?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'COURSE_THUMBNAIL MediaAsset id or secure URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'COURSE_BANNER MediaAsset id or secure URL' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bannerUrl?: string | null;

  @ApiPropertyOptional({ enum: COURSE_DIFFICULTIES })
  @IsOptional()
  @IsIn([...COURSE_DIFFICULTIES])
  difficulty?: CourseDifficultyValue;

  @ApiPropertyOptional({ enum: COURSE_STATUSES })
  @IsOptional()
  @IsIn([...COURSE_STATUSES])
  status?: CourseStatusValue;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(16)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  language?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Reassign course ownership to another teacher profile in the same organization',
  })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
