import { Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import type { WebhookAckResponseDto } from '../dto/payment-response.dto';
import { InvalidWebhookSignatureException } from '../exceptions';
import { PaymentsWebhookService } from '../services/payments-webhook.service';

/**
 * Public webhook endpoint. Deliberately NOT guarded by auth: authenticity is
 * established exclusively by the HMAC signature over the untouched raw body.
 */
@ApiTags('Payment Webhooks')
@Controller('payments/webhooks')
export class PaymentsWebhookController {
  constructor(private readonly webhookService: PaymentsWebhookService) {}

  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleRazorpay(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature?: string,
    @Headers('x-razorpay-event-id') eventId?: string,
  ): Promise<ControllerSuccessPayload<WebhookAckResponseDto>> {
    const rawBody = request.rawBody;
    // Reject before any parsing or processing when the body or signature is
    // missing — never process an unverified payload.
    if (!rawBody || rawBody.length === 0) {
      throw new InvalidWebhookSignatureException('The webhook body is missing.');
    }

    const result = await this.webhookService.handleRazorpayWebhook(rawBody, signature, eventId);
    return { message: 'Webhook acknowledged.', data: result };
  }
}
