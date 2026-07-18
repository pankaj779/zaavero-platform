import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CONVERSATION_TYPES, type ConversationTypeValue } from '../constants/messaging.constants';

export class CreateConversationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ enum: CONVERSATION_TYPES })
  @IsIn([...CONVERSATION_TYPES])
  type!: ConversationTypeValue;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Additional participant user ids; creator is added automatically',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  participantUserIds!: string[];
}
