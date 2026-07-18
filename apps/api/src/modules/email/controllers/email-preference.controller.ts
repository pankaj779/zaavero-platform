import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { OrganizationEmailQueryDto, UpdateEmailPreferenceDto } from '../dto/email.dto';
import { assertEmailOrganizationAccess } from '../services/email-admin.service';
import { EmailPreferenceService } from '../services/email-preference.service';

@ApiTags('Email Preferences')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('email/preferences')
export class EmailPreferenceController {
  constructor(private readonly preferences: EmailPreferenceService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user email preferences' })
  async get(@CurrentUser() user: AuthenticatedUser, @Query() query: OrganizationEmailQueryDto) {
    const organizationId = this.organization(user, query.organizationId);
    return {
      message: 'Email preferences retrieved.',
      data: await this.preferences.get(organizationId, user.id),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user email preferences' })
  async update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateEmailPreferenceDto) {
    assertEmailOrganizationAccess(user, dto.organizationId);
    const { organizationId, ...update } = dto;
    return {
      message: 'Email preferences updated.',
      data: await this.preferences.update(organizationId, user.id, update),
    };
  }

  private organization(user: AuthenticatedUser, requested?: string): string {
    if (requested) {
      assertEmailOrganizationAccess(user, requested);
      return requested;
    }
    if (user.organizationIds.length === 1 && user.organizationIds[0]) {
      return user.organizationIds[0];
    }
    throw new BadRequestException('organizationId is required.');
  }
}
