import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { CreateOrderDto } from '../dto/create-order.dto';
import {
  ListInvoicesQueryDto,
  ListOrdersQueryDto,
  OrganizationScopedQueryDto,
} from '../dto/payment-query.dto';
import type {
  InvoiceResponseDto,
  OrderResponseDto,
  PaginatedHistoryResponseDto,
  PaginatedInvoicesResponseDto,
  PaginatedOrdersResponseDto,
  PaymentCatalogResponseDto,
  PaymentConfigResponseDto,
  SubscriptionResponseDto,
} from '../dto/payment-response.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import { PaymentsService } from '../services/payments.service';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('config')
  @ApiOperation({
    summary: 'Get payment configuration',
    description:
      'Returns whether online payments are enabled and the public checkout key. Never exposes secrets.',
  })
  getConfig(): ControllerSuccessPayload<PaymentConfigResponseDto> {
    return this.paymentsService.getConfig();
  }

  @Get('catalog')
  @ApiOperation({
    summary: 'Get purchasable catalog',
    description: 'Published purchasable courses with open batches, and active subscription plans.',
  })
  getCatalog(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrganizationScopedQueryDto,
  ): Promise<ControllerSuccessPayload<PaymentCatalogResponseDto>> {
    return this.paymentsService.getCatalog(user, query);
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Unique key (8-128 chars); the same key returns the same order.',
  })
  @ApiOperation({
    summary: 'Create a payment order',
    description:
      'Amounts are computed server-side from the course/plan. Requires an Idempotency-Key header.',
  })
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<ControllerSuccessPayload<OrderResponseDto>> {
    return this.paymentsService.createOrder(user, dto, idempotencyKey);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a checkout payment',
    description:
      'Verifies the Razorpay checkout signature, cross-checks the payment with the provider, and fulfills the order.',
  })
  verifyPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyPaymentDto,
  ): Promise<ControllerSuccessPayload<OrderResponseDto>> {
    return this.paymentsService.verifyPayment(user, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List my payment orders' })
  listOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedOrdersResponseDto>> {
    return this.paymentsService.listOrders(user, query);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get my payment history' })
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedHistoryResponseDto>> {
    return this.paymentsService.getHistory(user, query);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List my invoices' })
  listInvoices(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListInvoicesQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedInvoicesResponseDto>> {
    return this.paymentsService.listInvoices(user, query);
  }

  @Get('invoices/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get one of my invoices' })
  getInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<InvoiceResponseDto>> {
    return this.paymentsService.getInvoiceById(user, id);
  }

  @Get('subscriptions/current')
  @ApiOperation({ summary: 'Get the current organization subscription' })
  getCurrentSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrganizationScopedQueryDto,
  ): Promise<ControllerSuccessPayload<SubscriptionResponseDto | null>> {
    return this.paymentsService.getCurrentSubscription(user, query);
  }
}
