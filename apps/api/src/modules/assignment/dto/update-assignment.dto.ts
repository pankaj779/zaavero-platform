import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ASSIGNMENT_STATUSES, type AssignmentStatusValue } from '../constants/assignment.constants';

export class UpdateAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  instructions?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'ASSIGNMENT_ATTACHMENT MediaAsset ids or secure URLs',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  attachmentUrls?: string[];

  @ApiPropertyOptional({ enum: ASSIGNMENT_STATUSES })
  @IsOptional()
  @IsIn([...ASSIGNMENT_STATUSES])
  status?: AssignmentStatusValue;

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsInt()
  @Min(1)
  maxScore?: number | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsDateString()
  dueAt?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsUUID()
  batchId?: string | null;
}
