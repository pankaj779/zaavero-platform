import { ApiProperty } from '@nestjs/swagger';

export class EmailActionResponseDto {
  @ApiProperty()
  updated!: boolean;
}

export class EmailWebhookAckResponseDto {
  @ApiProperty()
  duplicate!: boolean;

  @ApiProperty()
  processed!: boolean;
}

export class EmailPageMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class EmailPreferenceResponseDto {
  @ApiProperty()
  security!: true;

  @ApiProperty()
  marketing!: boolean;

  @ApiProperty()
  announcements!: boolean;

  @ApiProperty()
  assignments!: boolean;

  @ApiProperty()
  courses!: boolean;

  @ApiProperty()
  payments!: boolean;

  @ApiProperty()
  certificates!: boolean;

  @ApiProperty()
  liveClasses!: boolean;

  @ApiProperty()
  system!: boolean;

  @ApiProperty()
  digestMode!: string;
}

export interface PaginatedEmailResponseDto<T> {
  items: T[];
  meta: EmailPageMetaDto;
}
