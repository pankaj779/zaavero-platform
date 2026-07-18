import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  COURSE_DIFFICULTIES,
  COURSE_STATUSES,
  type CourseDifficultyValue,
  type CourseStatusValue,
} from '../constants/course.constants';

export class CourseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  teacherId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  thumbnailUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  bannerUrl!: string | null;

  @ApiProperty({ enum: COURSE_DIFFICULTIES })
  difficulty!: CourseDifficultyValue;

  @ApiProperty({ enum: COURSE_STATUSES })
  status!: CourseStatusValue;

  @ApiProperty()
  language!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;
}

export class CourseListMetaDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedCoursesResponseDto {
  @ApiProperty({ type: [CourseResponseDto] })
  items!: CourseResponseDto[];

  @ApiProperty({ type: CourseListMetaDto })
  meta!: CourseListMetaDto;
}
