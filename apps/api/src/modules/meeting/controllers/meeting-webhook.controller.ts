import { Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { InvalidMeetingWebhookException } from '../exceptions';
import { MeetingWebhookService } from '../services/meeting-webhook.service';

@ApiTags('Meeting Webhooks')
@Controller('meetings/webhooks')
export class MeetingWebhookController {
  constructor(private readonly webhooks: MeetingWebhookService) {}

  @Post('zoom')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async zoom(
    @Req() request: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.handle('ZOOM', request, headers);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async google(
    @Req() request: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.handle('GOOGLE_MEET', request, headers);
  }

  @Post('sandbox')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async sandbox(
    @Req() request: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return this.handle('SANDBOX', request, headers);
  }

  private async handle(
    provider: 'ZOOM' | 'GOOGLE_MEET' | 'SANDBOX',
    request: RawBodyRequest<Request>,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const rawBody = request.rawBody?.toString('utf8') ?? '';
    if (provider !== 'GOOGLE_MEET' && !rawBody) {
      throw new InvalidMeetingWebhookException('Webhook body is empty.');
    }
    const data = await this.webhooks.handle(provider, rawBody, headers);
    if (data.challengeResponse) {
      return data.challengeResponse;
    }
    return { message: 'Webhook acknowledged.', data };
  }
}
