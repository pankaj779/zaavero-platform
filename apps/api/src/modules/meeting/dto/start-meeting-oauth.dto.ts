import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  PROVISIONABLE_MEETING_PROVIDERS,
  type ProvisionableMeetingProvider,
} from '../constants/meeting.constants';

export class StartMeetingOAuthDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ enum: PROVISIONABLE_MEETING_PROVIDERS })
  @IsIn([...PROVISIONABLE_MEETING_PROVIDERS])
  provider!: ProvisionableMeetingProvider;

  @ApiPropertyOptional({ description: 'Frontend path to return to after OAuth.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  redirectPath?: string;
}
