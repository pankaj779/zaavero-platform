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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  AdminAuditQueryDto,
  AdminListQueryDto,
  AssignUserRolesDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  UpdateOrganizationDto,
  UpdateTeacherProfileDto,
} from '../dto/admin.dto';
import { AdminService } from '../services/admin.service';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AUTH_ROLES.admin)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get organization admin dashboard' })
  overview(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organizationId') organizationId?: string,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.overview(user, organizationId);
  }

  @Get('users')
  @ApiOperation({ summary: 'List organization users' })
  listUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AdminListQueryDto,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.listUsers(user, query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get an organization user' })
  getUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.getUser(user, id, organizationId);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an organization user' })
  createUser(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdminUserDto,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.createUser(user, dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update or deactivate an organization user' })
  updateUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
    @Query('organizationId') organizationId?: string,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.updateUser(user, id, dto, organizationId);
  }

  @Patch('users/:id/roles')
  @ApiOperation({ summary: 'Replace user role assignments' })
  assignRoles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignUserRolesDto,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.assignRoles(user, id, dto);
  }

  @Get('roles')
  @ApiOperation({ summary: 'List roles and permission assignments' })
  roles(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organizationId') organizationId?: string,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.listRoles(user, organizationId);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List available permissions' })
  permissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organizationId') organizationId?: string,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.listPermissions(user, organizationId);
  }

  @Get('organization')
  @ApiOperation({ summary: 'Get active organization profile' })
  organization(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organizationId') organizationId?: string,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.getOrganization(user, organizationId);
  }

  @Patch('organization/:id')
  @ApiOperation({ summary: 'Update organization profile and locale' })
  updateOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.updateOrganization(user, id, dto);
  }

  @Patch('teachers/:id')
  @ApiOperation({ summary: 'Update a teacher profile' })
  updateTeacher(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeacherProfileDto,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.updateTeacherProfile(user, id, dto);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'List organization-scoped audit logs' })
  auditLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AdminAuditQueryDto,
  ): Promise<ControllerSuccessPayload<unknown>> {
    return this.adminService.auditLogs(user, query);
  }
}
