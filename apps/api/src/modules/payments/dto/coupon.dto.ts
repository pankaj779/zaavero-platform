import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Wire values accepted from clients; normalized to Prisma CouponType. */
export const COUPON_DISCOUNT_TYPES = ['percent', 'fixed'] as const;
export type CouponDiscountTypeValue = (typeof COUPON_DISCOUNT_TYPES)[number];

const uppercase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeDiscountType = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }
  const normalized = value.trim().toLowerCase();
  if (['percentage', 'percent'].includes(normalized)) {
    return 'percent';
  }
  if (['fixed', 'fixed_amount', 'flat', 'amount'].includes(normalized)) {
    return 'fixed';
  }
  return normalized;
};

export class CreateCouponDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ maxLength: 64, example: 'WELCOME10' })
  @Transform(uppercase)
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code may contain letters, digits, underscore, and dash',
  })
  code!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  name?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimmed)
  description?: string;

  @ApiProperty({ enum: COUPON_DISCOUNT_TYPES })
  @Transform(normalizeDiscountType)
  @IsIn([...COUPON_DISCOUNT_TYPES])
  discountType!: CouponDiscountTypeValue;

  @ApiProperty({
    description:
      'Percent points (e.g. 10 = 10%) for percent coupons; minor units for fixed coupons',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  discountValue!: number;

  @ApiPropertyOptional({ example: 'INR', description: 'Required for fixed coupons' })
  @IsOptional()
  @Transform(uppercase)
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  minimumOrderMinor?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  maximumDiscountMinor?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  maxRedemptions?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  name?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimmed)
  description?: string;

  @ApiPropertyOptional({ enum: COUPON_DISCOUNT_TYPES })
  @IsOptional()
  @Transform(normalizeDiscountType)
  @IsIn([...COUPON_DISCOUNT_TYPES])
  discountType?: CouponDiscountTypeValue;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  discountValue?: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @Transform(uppercase)
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  minimumOrderMinor?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  maximumDiscountMinor?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  maxRedemptions?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
