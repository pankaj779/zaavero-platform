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
import { BatchResponseDto, PaginatedBatchesResponseDto } from '../dto/batch-response.dto';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { ListBatchesQueryDto } from '../dto/list-batches-query.dto';
import { UpdateBatchDto } from '../dto/update-batch.dto';
import { BatchService } from '../services/batch.service';

@ApiTags('Batches')
@ApiBearerAuth('access-token')
@Controller('batches')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get()
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiOperation({
    summary: 'List batches',
    description:
      'Returns paginated batches for an organization with optional search, status, courseId, teacherId, and sorting.',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListBatchesQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedBatchesResponseDto>> {
    return this.batchService.list(user, query);
  }

  @Get(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get a batch by id' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<BatchResponseDto>> {
    return this.batchService.getById(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseCreate)
  @ApiOperation({ summary: 'Create a batch' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBatchDto,
  ): Promise<ControllerSuccessPayload<BatchResponseDto>> {
    return this.batchService.create(user, dto);
  }

  @Patch(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update a batch' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBatchDto,
  ): Promise<ControllerSuccessPayload<BatchResponseDto>> {
    return this.batchService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Soft-delete a batch' })
  softDelete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<BatchResponseDto>> {
    return this.batchService.softDelete(user, id);
  }
}
