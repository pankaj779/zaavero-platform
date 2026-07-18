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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  AcceptInvitationDto,
  CreateInvitationDto,
  InvitationOrganizationDto,
} from '../dto/invitation.dto';
import { InvitationService } from '../services/invitation.service';

@ApiTags('Email Invitations')
@Controller('email/invitations')
export class EmailInvitationController {
  constructor(private readonly invitations: InvitationService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @ApiOperation({ summary: 'List recent organization invitations' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.invitations.list(user, organizationId);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @ApiOperation({ summary: 'Create and email an organization invitation' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInvitationDto) {
    return this.invitations.create(user, dto);
  }

  @Post(':id/resend')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @ApiOperation({ summary: 'Rotate token and resend a pending invitation' })
  resend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InvitationOrganizationDto,
  ) {
    return this.invitations.resend(user, dto.organizationId, id);
  }

  @Post(':id/revoke')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InvitationOrganizationDto,
  ) {
    return this.invitations.revoke(user, dto.organizationId, id);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept an invitation and create or link an account' })
  accept(@Body() dto: AcceptInvitationDto) {
    return this.invitations.accept(dto);
  }
}
