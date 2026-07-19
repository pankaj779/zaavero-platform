import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { EnvConfig } from '../../../config/env.schema';
import type { ProvisionableMeetingProvider } from '../constants/meeting.constants';
import { MeetingOAuthService } from '../services/meeting-oauth.service';

@ApiExcludeController()
@Controller('meetings/oauth')
export class MeetingOAuthController {
  constructor(
    private readonly oauth: MeetingOAuthService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  @Get('zoom/callback')
  async zoomCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    return this.finish('ZOOM', { code, state, error }, res);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    return this.finish('GOOGLE_MEET', { code, state, error }, res);
  }

  @Get('sandbox/callback')
  async sandboxCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    return this.finish('SANDBOX', { code, state, error }, res);
  }

  private async finish(
    provider: ProvisionableMeetingProvider,
    query: { code?: string; state?: string; error?: string },
    res: Response,
  ) {
    const result = await this.oauth.handleCallback({ provider, ...query });
    const frontend = this.config.get('FRONTEND_URL', { infer: true });
    const path = result.redirectPath.startsWith('/')
      ? result.redirectPath
      : `/${result.redirectPath}`;
    const url = new URL(path, frontend);
    url.searchParams.set('meetingOAuth', 'connected');
    url.searchParams.set('provider', provider);
    res.redirect(url.toString());
  }
}
