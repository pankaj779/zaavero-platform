import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  BILLING_INTERVALS,
  PLAN_TIERS,
  type BillingIntervalValue,
  type PlanTierValue,
} from '../constants/payment.constants';

const uppercase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePlanDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimmed)
  description?: string;

  @ApiProperty({ description: 'Price in minor units (paise)', minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMinor!: number;

  @ApiProperty({ example: 'INR' })
  @Transform(uppercase)
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency!: string;

  @ApiProperty({ enum: BILLING_INTERVALS })
  @Transform(uppercase)
  @IsIn([...BILLING_INTERVALS])
  interval!: BillingIntervalValue;

  @ApiPropertyOptional({
    enum: PLAN_TIERS,
    default: 'BASIC',
    description: 'Tier + interval must be unique per organization',
  })
  @IsOptional()
  @Transform(uppercase)
  @IsIn([...PLAN_TIERS])
  tier?: PlanTierValue;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  trialDays?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  features?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Accepted for compatibility; not persisted' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimmed)
  name?: string;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(trimmed)
  description?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMinor?: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @Transform(uppercase)
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({ enum: BILLING_INTERVALS })
  @IsOptional()
  @Transform(uppercase)
  @IsIn([...BILLING_INTERVALS])
  interval?: BillingIntervalValue;

  @ApiPropertyOptional({ enum: PLAN_TIERS })
  @IsOptional()
  @Transform(uppercase)
  @IsIn([...PLAN_TIERS])
  tier?: PlanTierValue;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  trialDays?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Accepted for compatibility; not persisted' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
