import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import {
  MarkAllReadResponseDto,
  NotificationResponseDto,
  PaginatedNotificationsResponseDto,
} from '../dto/notification-response.dto';
import { UpdateNotificationReadDto } from '../dto/update-notification-read.dto';
import { NotificationService } from '../services/notification.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiOperation({
    summary: 'List notifications',
    description:
      'Students only see their own notifications. Admins and teachers may filter by userId.',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedNotificationsResponseDto>> {
    return this.notificationService.list(user, query);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiOperation({ summary: 'Mark all own notifications as read' })
  markAllRead(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
  ): Promise<ControllerSuccessPayload<MarkAllReadResponseDto>> {
    return this.notificationService.markAllRead(user, organizationId);
  }

  @Get(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get a notification by id' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<NotificationResponseDto>> {
    return this.notificationService.getById(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseCreate)
  @ApiOperation({ summary: 'Create a notification for a user' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNotificationDto,
  ): Promise<ControllerSuccessPayload<NotificationResponseDto>> {
    return this.notificationService.create(user, dto);
  }

  @Patch(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Mark a notification read or unread' })
  updateReadState(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotificationReadDto,
  ): Promise<ControllerSuccessPayload<NotificationResponseDto>> {
    return this.notificationService.updateReadState(user, id, dto);
  }

  @Patch(':id/read')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<NotificationResponseDto>> {
    return this.notificationService.markRead(user, id);
  }
}
