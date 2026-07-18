import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateNotificationReadDto {
  @ApiProperty({ description: 'true to mark read, false to mark unread' })
  @IsBoolean()
  read!: boolean;
}
