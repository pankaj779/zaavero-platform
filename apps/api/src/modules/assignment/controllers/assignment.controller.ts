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
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  AssignmentResponseDto,
  PaginatedAssignmentsResponseDto,
} from '../dto/assignment-response.dto';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { ListAssignmentsQueryDto } from '../dto/list-assignments-query.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { AssignmentService } from '../services/assignment.service';

@ApiTags('Assignments')
@ApiBearerAuth('access-token')
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get()
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiOperation({
    summary: 'List assignments',
    description:
      'Returns paginated assignments with optional organization, course, batch, status, and title search filters.',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAssignmentsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedAssignmentsResponseDto>> {
    return this.assignmentService.list(user, query);
  }

  @Get(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get an assignment by id' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<AssignmentResponseDto>> {
    return this.assignmentService.getById(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseCreate)
  @ApiOperation({ summary: 'Create an assignment' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAssignmentDto,
  ): Promise<ControllerSuccessPayload<AssignmentResponseDto>> {
    return this.assignmentService.create(user, dto);
  }

  @Patch(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update an assignment' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssignmentDto,
  ): Promise<ControllerSuccessPayload<AssignmentResponseDto>> {
    return this.assignmentService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({
    summary: 'Soft-delete an assignment',
    description: 'Sets deletedAt without removing the row.',
  })
  softDelete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<AssignmentResponseDto>> {
    return this.assignmentService.softDelete(user, id);
  }
}
