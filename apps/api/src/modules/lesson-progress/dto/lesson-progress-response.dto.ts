import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LESSON_PROGRESS_STATUSES,
  type LessonProgressStatusValue,
} from '../constants/lesson-progress.constants';

export class LessonProgressResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) organizationId!: string;
  @ApiProperty({ format: 'uuid' }) lessonId!: string;
  @ApiProperty({ format: 'uuid' }) studentId!: string;
  @ApiProperty({ enum: LESSON_PROGRESS_STATUSES }) status!: LessonProgressStatusValue;
  @ApiProperty() progressPercent!: number;
  @ApiPropertyOptional({ nullable: true }) lastPositionSeconds!: number | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) completedAt!:
    string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}
export class LessonProgressListMetaDto {
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}
export class PaginatedLessonProgressResponseDto {
  @ApiProperty({ type: [LessonProgressResponseDto] }) items!: LessonProgressResponseDto[];
  @ApiProperty({ type: LessonProgressListMetaDto }) meta!: LessonProgressListMetaDto;
}
