import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { AssignSubscriptionDto, RetryOrderDto } from '../dto/assign-subscription.dto';
import { AttachInvoicePdfDto } from '../dto/attach-invoice-pdf.dto';
import { CreateCouponDto, UpdateCouponDto } from '../dto/coupon.dto';
import {
  ListCouponsQueryDto,
  ListInvoicesQueryDto,
  ListOrdersQueryDto,
  ListPlansQueryDto,
  ListRefundsQueryDto,
  ListSubscriptionsQueryDto,
  OrganizationScopedQueryDto,
} from '../dto/payment-query.dto';
import type {
  AdminPaymentOverviewResponseDto,
  CouponResponseDto,
  InvoiceResponseDto,
  OrderResponseDto,
  PaginatedCouponsResponseDto,
  PaginatedInvoicesResponseDto,
  PaginatedPlansResponseDto,
  PaginatedRefundsResponseDto,
  PaginatedSubscriptionsResponseDto,
  PaginatedTransactionsResponseDto,
  PlanResponseDto,
  RefundResponseDto,
  SubscriptionResponseDto,
} from '../dto/payment-response.dto';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';
import { CreateRefundDto } from '../dto/refund.dto';
import { PaymentsAdminService } from '../services/payments-admin.service';

@ApiTags('Payments Admin')
@ApiBearerAuth('access-token')
@Controller('payments/admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(AUTH_ROLES.admin)
@Permissions(AUTH_PERMISSIONS.paymentManage)
export class PaymentsAdminController {
  constructor(private readonly adminService: PaymentsAdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Payment KPIs for the organization' })
  getOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrganizationScopedQueryDto,
  ): Promise<ControllerSuccessPayload<AdminPaymentOverviewResponseDto>> {
    return this.adminService.getOverview(user, query);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List subscription plans' })
  listPlans(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPlansQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedPlansResponseDto>> {
    return this.adminService.listPlans(user, query);
  }

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a subscription plan' })
  createPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlanDto,
  ): Promise<ControllerSuccessPayload<PlanResponseDto>> {
    return this.adminService.createPlan(user, dto);
  }

  @Patch('plans/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update a subscription plan' })
  updatePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<ControllerSuccessPayload<PlanResponseDto>> {
    return this.adminService.updatePlan(user, id, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List transactions (orders with latest payment)' })
  listTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedTransactionsResponseDto>> {
    return this.adminService.listTransactions(user, query);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List all organization invoices' })
  listInvoices(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListInvoicesQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedInvoicesResponseDto>> {
    return this.adminService.listInvoices(user, query);
  }

  @Patch('invoices/:id/pdf')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Attach a stored PDF to an invoice' })
  attachInvoicePdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachInvoicePdfDto,
  ): Promise<ControllerSuccessPayload<InvoiceResponseDto>> {
    return this.adminService.attachInvoicePdf(user, id, dto);
  }

  @Get('refunds')
  @ApiOperation({ summary: 'List refunds' })
  listRefunds(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRefundsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedRefundsResponseDto>> {
    return this.adminService.listRefunds(user, query);
  }

  @Post('refunds')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Unique key (8-128 chars); the same key returns the same refund.',
  })
  @ApiOperation({
    summary: 'Create a refund',
    description:
      'Validates the amount against the captured payment minus prior refunds, then refunds via the provider.',
  })
  createRefund(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRefundDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<ControllerSuccessPayload<RefundResponseDto>> {
    return this.adminService.createRefund(user, dto, idempotencyKey);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List organization subscriptions' })
  listSubscriptions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListSubscriptionsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedSubscriptionsResponseDto>> {
    return this.adminService.listSubscriptions(user, query);
  }

  @Post('subscriptions/assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assign a plan to the organization',
    description: 'Admin action without payment; replaces any active subscription transactionally.',
  })
  assignSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignSubscriptionDto,
  ): Promise<ControllerSuccessPayload<SubscriptionResponseDto>> {
    return this.adminService.assignSubscription(user, dto);
  }

  @Get('coupons')
  @ApiOperation({ summary: 'List coupons' })
  listCoupons(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCouponsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedCouponsResponseDto>> {
    return this.adminService.listCoupons(user, query);
  }

  @Post('coupons')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a coupon' })
  createCoupon(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCouponDto,
  ): Promise<ControllerSuccessPayload<CouponResponseDto>> {
    return this.adminService.createCoupon(user, dto);
  }

  @Patch('coupons/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update a coupon' })
  updateCoupon(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ): Promise<ControllerSuccessPayload<CouponResponseDto>> {
    return this.adminService.updateCoupon(user, id, dto);
  }

  @Post('orders/:id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Unique key for this retry action (audited).',
  })
  @ApiOperation({
    summary: 'Retry a failed order',
    description:
      'Issues a fresh provider order for the same authoritative totals; totals never change.',
  })
  retryOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RetryOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<ControllerSuccessPayload<OrderResponseDto>> {
    return this.adminService.retryOrder(user, id, dto, idempotencyKey);
  }
}
