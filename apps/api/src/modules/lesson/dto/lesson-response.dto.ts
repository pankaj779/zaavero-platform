import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LESSON_CONTENT_TYPES, type LessonContentTypeValue } from '../constants/lesson.constants';

export class LessonResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  moduleId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: LESSON_CONTENT_TYPES })
  contentType!: LessonContentTypeValue;

  @ApiPropertyOptional({ nullable: true })
  contentUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  durationSeconds!: number | null;

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class LessonListMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedLessonsResponseDto {
  @ApiProperty({ type: [LessonResponseDto] })
  items!: LessonResponseDto[];

  @ApiProperty({ type: LessonListMetaDto })
  meta!: LessonListMetaDto;
}
