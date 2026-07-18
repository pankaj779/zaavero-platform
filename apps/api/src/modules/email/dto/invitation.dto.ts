import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export const INVITATION_TYPES = ['TEACHER', 'STUDENT', 'ORGANIZATION'] as const;
export type InvitationType = (typeof INVITATION_TYPES)[number];

export class CreateInvitationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ enum: INVITATION_TYPES })
  @IsIn(INVITATION_TYPES)
  type!: InvitationType;

  @ApiProperty({ description: 'Existing system role name, for example TEACHER or STUDENT.' })
  @IsString()
  @MaxLength(64)
  role!: string;
}

export class InvitationOrganizationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;
}

export class AcceptInvitationDto {
  @ApiProperty()
  @IsString()
  @MinLength(32)
  @MaxLength(512)
  token!: string;

  @ApiPropertyOptional({ description: 'Required when the invited email has no account.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Required when the invited email has no account.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Required when the invited email has no account.' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;
}
