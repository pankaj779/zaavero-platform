import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PAYMENT_PROVIDER, PAYMENT_REPOSITORY } from './constants/payment.constants';
import { PaymentsAdminController } from './controllers/payments-admin.controller';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsWebhookController } from './controllers/payments-webhook.controller';
import { RazorpayProvider } from './providers/razorpay.provider';
import { PrismaPaymentsRepository } from './repositories/prisma-payments.repository';
import { PaymentsAdminService } from './services/payments-admin.service';
import { PaymentsService } from './services/payments.service';
import { PaymentsWebhookService } from './services/payments-webhook.service';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController, PaymentsAdminController, PaymentsWebhookController],
  providers: [
    PaymentsService,
    PaymentsAdminService,
    PaymentsWebhookService,
    {
      provide: PAYMENT_PROVIDER,
      useClass: RazorpayProvider,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PrismaPaymentsRepository,
    },
  ],
  exports: [PaymentsService, PAYMENT_REPOSITORY],
})
export class PaymentsModule {}
