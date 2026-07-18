import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'USER_AVATAR MediaAsset id or secure URL; null removes the avatar',
  })
  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsString()
  @MaxLength(2000)
  profileImage!: string | null;
}
