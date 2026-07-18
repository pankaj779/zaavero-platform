import { Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { InvalidEmailWebhookException } from '../exceptions';
import { EmailWebhookService } from '../services/email-webhook.service';

@ApiTags('Email Webhooks')
@Controller('email/webhooks')
export class EmailWebhookController {
  constructor(private readonly webhook: EmailWebhookService) {}

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handle(
    @Req() request: RawBodyRequest<Request>,
    @Headers('svix-id') svixId?: string,
    @Headers('svix-timestamp') svixTimestamp?: string,
    @Headers('svix-signature') svixSignature?: string,
  ) {
    if (!request.rawBody?.length || !svixId || !svixTimestamp || !svixSignature) {
      throw new InvalidEmailWebhookException();
    }
    const data = await this.webhook.handle({
      rawBody: request.rawBody.toString('utf8'),
      svixId,
      svixTimestamp,
      svixSignature,
    });
    return { message: 'Webhook acknowledged.', data };
  }
}
