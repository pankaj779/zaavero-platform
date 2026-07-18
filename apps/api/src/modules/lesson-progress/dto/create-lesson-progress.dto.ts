import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  LESSON_PROGRESS_STATUSES,
  type LessonProgressStatusValue,
} from '../constants/lesson-progress.constants';

export class CreateLessonProgressDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() lessonId!: string;
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Required for Admin/Teacher; Students default to own profile',
  })
  @IsOptional()
  @IsUUID()
  studentId?: string;
  @ApiPropertyOptional({ enum: LESSON_PROGRESS_STATUSES })
  @IsOptional()
  @IsIn([...LESSON_PROGRESS_STATUSES])
  status?: LessonProgressStatusValue;
  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lastPositionSeconds?: number;
}
