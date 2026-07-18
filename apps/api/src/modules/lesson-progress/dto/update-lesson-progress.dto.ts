import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  LESSON_PROGRESS_STATUSES,
  type LessonProgressStatusValue,
} from '../constants/lesson-progress.constants';

export class UpdateLessonProgressDto {
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
  @ApiPropertyOptional({ minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lastPositionSeconds?: number | null;
}
