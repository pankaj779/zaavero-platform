import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import {
  COURSE_DIFFICULTIES,
  COURSE_SLUG_PATTERN,
  COURSE_STATUSES,
  type CourseDifficultyValue,
  type CourseStatusValue,
} from '../constants/course.constants';

export class CreateCourseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Organization that owns the course',
  })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ example: 'Introduction to Handwriting Analysis' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @ApiProperty({
    example: 'intro-handwriting-analysis',
    description: 'URL-safe slug, unique within the organization',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(COURSE_SLUG_PATTERN, {
    message: 'slug must be lowercase kebab-case (a-z, 0-9, hyphens)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug!: string;

  @ApiPropertyOptional({ example: 'A beginner-friendly overview of the curriculum.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  })
  description?: string;

  @ApiPropertyOptional({ description: 'COURSE_THUMBNAIL MediaAsset id or secure URL' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'COURSE_BANNER MediaAsset id or secure URL' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bannerUrl?: string;

  @ApiPropertyOptional({ enum: COURSE_DIFFICULTIES, default: 'BEGINNER' })
  @IsOptional()
  @IsIn([...COURSE_DIFFICULTIES])
  difficulty?: CourseDifficultyValue;

  @ApiPropertyOptional({ enum: COURSE_STATUSES, default: 'DRAFT' })
  @IsOptional()
  @IsIn([...COURSE_STATUSES])
  status?: CourseStatusValue;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
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
    description:
      'Teacher profile id. Required for Admin creates; Teachers default to their own profile.',
  })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
