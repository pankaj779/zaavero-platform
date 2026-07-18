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
import { AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { CreateLessonProgressDto } from '../dto/create-lesson-progress.dto';
import { ListLessonProgressQueryDto } from '../dto/list-lesson-progress-query.dto';
import {
  LessonProgressResponseDto,
  PaginatedLessonProgressResponseDto,
} from '../dto/lesson-progress-response.dto';
import { UpdateLessonProgressDto } from '../dto/update-lesson-progress.dto';
import { LessonProgressService } from '../services/lesson-progress.service';

@ApiTags('Lesson Progress')
@ApiBearerAuth('access-token')
@Controller('lesson-progress')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class LessonProgressController {
  constructor(private readonly lessonProgressService: LessonProgressService) {}

  @Get()
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiOperation({ summary: 'List lesson progress' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListLessonProgressQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedLessonProgressResponseDto>> {
    return this.lessonProgressService.list(user, query);
  }

  @Get(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get lesson progress by id' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<LessonProgressResponseDto>> {
    return this.lessonProgressService.getById(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiOperation({ summary: 'Create lesson progress' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLessonProgressDto,
  ): Promise<ControllerSuccessPayload<LessonProgressResponseDto>> {
    return this.lessonProgressService.create(user, dto);
  }

  @Patch(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update lesson progress' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonProgressDto,
  ): Promise<ControllerSuccessPayload<LessonProgressResponseDto>> {
    return this.lessonProgressService.update(user, id, dto);
  }
}
