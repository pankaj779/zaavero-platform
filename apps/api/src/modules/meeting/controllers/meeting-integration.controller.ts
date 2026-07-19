import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  PROVISIONABLE_MEETING_PROVIDERS,
  type ProvisionableMeetingProvider,
} from '../constants/meeting.constants';
import { StartMeetingOAuthDto } from '../dto/start-meeting-oauth.dto';
import { InvalidMeetingRequestException } from '../exceptions';
import { MeetingIntegrationService } from '../services/meeting-integration.service';
import { MeetingOAuthService } from '../services/meeting-oauth.service';

@ApiTags('Meeting Integrations')
@ApiBearerAuth('access-token')
@Controller('meetings/integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeetingIntegrationController {
  constructor(
    private readonly integrations: MeetingIntegrationService,
    private readonly oauth: MeetingOAuthService,
  ) {}

  @Get()
  @Roles(AUTH_ROLES.admin)
  @ApiOperation({ summary: 'List meeting provider integrations for an organization' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.integrations.list(user, organizationId);
  }

  @Post('oauth/start')
  @Roles(AUTH_ROLES.admin)
  @ApiOperation({ summary: 'Start Zoom / Google Meet / Sandbox OAuth connect flow' })
  startOAuth(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartMeetingOAuthDto) {
    return this.oauth.start(user, dto);
  }

  @Delete(':organizationId/:provider')
  @Roles(AUTH_ROLES.admin)
  @ApiOperation({ summary: 'Disconnect a meeting provider integration' })
  disconnect(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('provider') provider: string,
  ) {
    const normalized = provider.toUpperCase().replace(/-/g, '_') as ProvisionableMeetingProvider;
    if (!(PROVISIONABLE_MEETING_PROVIDERS as readonly string[]).includes(normalized)) {
      throw new InvalidMeetingRequestException(`Unsupported meeting provider "${provider}".`);
    }
    return this.oauth.disconnect(user, organizationId, normalized);
  }
}
