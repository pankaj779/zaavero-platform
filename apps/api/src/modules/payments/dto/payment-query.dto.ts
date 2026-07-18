import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  INVOICE_STATUSES,
  ORDER_PURPOSES,
  ORDER_STATUSES,
  PAYMENT_DEFAULT_LIMIT,
  PAYMENT_DEFAULT_PAGE,
  PAYMENT_MAX_PAGE_SIZE,
  PAYMENT_SORT_FIELDS,
  REFUND_STATUSES,
  SUBSCRIPTION_STATUSES,
  type InvoiceStatusValue,
  type OrderPurposeValue,
  type OrderStatusValue,
  type PaymentSortField,
  type RefundStatusValue,
  type SubscriptionStatusValue,
} from '../constants/payment.constants';

const uppercase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const trimmed = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class PaymentListQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Case-insensitive search' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trimmed)
  search?: string;

  @ApiPropertyOptional({ default: PAYMENT_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = PAYMENT_DEFAULT_PAGE;

  @ApiPropertyOptional({
    default: PAYMENT_DEFAULT_LIMIT,
    minimum: 1,
    maximum: PAYMENT_MAX_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAYMENT_MAX_PAGE_SIZE)
  limit: number = PAYMENT_DEFAULT_LIMIT;

  @ApiPropertyOptional({ enum: PAYMENT_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn([...PAYMENT_SORT_FIELDS])
  sortBy: PaymentSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}

export class ListOrdersQueryDto extends PaymentListQueryDto {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @Transform(uppercase)
  @IsIn([...ORDER_STATUSES])
  status?: OrderStatusValue;

  @ApiPropertyOptional({ enum: ORDER_PURPOSES })
  @IsOptional()
  @Transform(uppercase)
  @IsIn([...ORDER_PURPOSES])
  purpose?: OrderPurposeValue;
}

export class ListInvoicesQueryDto extends PaymentListQueryDto {
  @ApiPropertyOptional({ enum: INVOICE_STATUSES })
  @IsOptional()
  @Transform(uppercase)
  @IsIn([...INVOICE_STATUSES])
  status?: InvoiceStatusValue;
}

export class ListRefundsQueryDto extends PaymentListQueryDto {
  @ApiPropertyOptional({ enum: REFUND_STATUSES })
  @IsOptional()
  @Transform(uppercase)
  @IsIn([...REFUND_STATUSES])
  status?: RefundStatusValue;
}

export class ListSubscriptionsQueryDto extends PaymentListQueryDto {
  @ApiPropertyOptional({ enum: SUBSCRIPTION_STATUSES })
  @IsOptional()
  @Transform(uppercase)
  @IsIn([...SUBSCRIPTION_STATUSES])
  status?: SubscriptionStatusValue;
}

export class ListPlansQueryDto extends PaymentListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by active flag' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) {
      return true;
    }
    if (value === 'false' || value === false) {
      return false;
    }
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Alias for isActive: "active" | "inactive"' })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

export class ListCouponsQueryDto extends PaymentListQueryDto {
  @ApiPropertyOptional({ description: 'Filter: "active" | "inactive"' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

export class OrganizationScopedQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
