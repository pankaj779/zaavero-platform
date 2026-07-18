import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class VerifyPaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ format: 'uuid', description: 'Local payment order id' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ description: 'Razorpay order id (order_...)' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Transform(trimmed)
  providerOrderId!: string;

  @ApiProperty({ description: 'Razorpay payment id (pay_...)' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Transform(trimmed)
  providerPaymentId!: string;

  @ApiProperty({ description: 'Checkout HMAC signature (hex)' })
  @IsString()
  @MinLength(16)
  @MaxLength(512)
  @Matches(/^[a-f0-9]+$/i, { message: 'signature must be a hex string' })
  @Transform(trimmed)
  signature!: string;
}
