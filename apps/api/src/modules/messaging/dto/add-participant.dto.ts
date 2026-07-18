import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;
}
