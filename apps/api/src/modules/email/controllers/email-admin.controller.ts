import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  CancelEmailDto,
  EmailListQueryDto,
  OrganizationEmailQueryDto,
  PreviewEmailTemplateDto,
  RetryEmailDto,
} from '../dto/email.dto';
import { EmailAdminService } from '../services/email-admin.service';

@ApiTags('Email Admin')
@ApiBearerAuth('access-token')
@Controller('email/admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(AUTH_ROLES.admin)
@Permissions(AUTH_PERMISSIONS.emailView)
export class EmailAdminController {
  constructor(private readonly admin: EmailAdminService) {}

  @Get('logs')
  @ApiOperation({ summary: 'List tenant email delivery logs' })
  async logs(@CurrentUser() user: AuthenticatedUser, @Query() query: EmailListQueryDto) {
    return { message: 'Email logs retrieved.', data: await this.admin.listLogs(user, query) };
  }

  @Get('queue')
  @ApiOperation({ summary: 'List tenant email queue' })
  async queue(@CurrentUser() user: AuthenticatedUser, @Query() query: EmailListQueryDto) {
    return { message: 'Email queue retrieved.', data: await this.admin.listQueue(user, query) };
  }

  @Get('failed')
  @ApiOperation({ summary: 'List dead-letter or failed queued email' })
  async failed(@CurrentUser() user: AuthenticatedUser, @Query() query: EmailListQueryDto) {
    const failedQuery = new EmailListQueryDto();
    failedQuery.organizationId = query.organizationId;
    failedQuery.search = query.search;
    failedQuery.status = query.status ?? 'DEAD_LETTER';
    failedQuery.page = query.page;
    failedQuery.limit = query.limit;
    return {
      message: 'Failed email retrieved.',
      data: await this.admin.listQueue(user, failedQuery),
    };
  }

  @Post('queue/:id/cancel')
  @Permissions(AUTH_PERMISSIONS.emailManage)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Cancel queued email' })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelEmailDto,
  ) {
    return {
      message: 'Email cancellation processed.',
      data: { updated: await this.admin.cancel(user, dto.organizationId, id, dto.reason) },
    };
  }

  @Post('queue/:id/retry')
  @Permissions(AUTH_PERMISSIONS.emailRetry)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Retry dead-letter email' })
  async retry(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RetryEmailDto,
  ) {
    return {
      message: 'Email retry processed.',
      data: { updated: await this.admin.retry(user, dto.organizationId, id) },
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'List active tenant and system email templates' })
  async templates(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrganizationEmailQueryDto,
  ) {
    return {
      message: 'Email templates retrieved.',
      data: await this.admin.listTemplates(user, query),
    };
  }

  @Post('templates/preview')
  @Permissions(AUTH_PERMISSIONS.emailTemplateManage)
  @ApiOperation({ summary: 'Render an email template preview' })
  async preview(@CurrentUser() user: AuthenticatedUser, @Body() dto: PreviewEmailTemplateDto) {
    return {
      message: 'Email template preview rendered.',
      data: await this.admin.preview(user, dto),
    };
  }

  @Get('provider')
  @ApiOperation({ summary: 'Get active email provider status' })
  provider() {
    return { message: 'Email provider status retrieved.', data: this.admin.getProviderStatus() };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get basic tenant delivery statistics' })
  async stats(@CurrentUser() user: AuthenticatedUser, @Query() query: OrganizationEmailQueryDto) {
    return {
      message: 'Email delivery statistics retrieved.',
      data: await this.admin.getStats(user, query),
    };
  }
}
