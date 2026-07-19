import {
  Body,
  Controller,
  Delete,
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
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { CreateLiveSessionDto } from '../dto/create-live-session.dto';
import { ListLiveSessionsQueryDto } from '../dto/list-live-sessions-query.dto';
import { UpdateLiveSessionDto } from '../dto/update-live-session.dto';
import { LiveSessionService } from '../services/live-session.service';

@ApiTags('Live Sessions')
@ApiBearerAuth('access-token')
@Controller('live-sessions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class LiveSessionController {
  constructor(private readonly liveSessionService: LiveSessionService) {}

  @Get()
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiOperation({ summary: 'List live sessions' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListLiveSessionsQueryDto) {
    return this.liveSessionService.list(user, query);
  }

  @Get(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get live session by id' })
  getById(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.liveSessionService.getById(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseCreate)
  @ApiOperation({ summary: 'Create a live session' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLiveSessionDto) {
    return this.liveSessionService.create(user, dto);
  }

  @Patch(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update a live session' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLiveSessionDto,
  ) {
    return this.liveSessionService.update(user, id, dto);
  }

  @Post(':id/start')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Start a live session' })
  start(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.liveSessionService.start(user, id);
  }

  @Post(':id/end')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'End a live session' })
  end(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.liveSessionService.end(user, id);
  }

  @Post(':id/cancel')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Cancel a live session and delete the provider meeting' })
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.liveSessionService.cancel(user, id);
  }

  @Delete(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Soft-delete a live session' })
  softDelete(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.liveSessionService.softDelete(user, id);
  }
}
