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
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { CreateSubmissionDto } from '../dto/create-submission.dto';
import { ListSubmissionsQueryDto } from '../dto/list-submissions-query.dto';
import {
  PaginatedSubmissionsResponseDto,
  SubmissionResponseDto,
} from '../dto/submission-response.dto';
import { UpdateSubmissionDto } from '../dto/update-submission.dto';
import { SubmissionService } from '../services/submission.service';

@ApiTags('Submissions')
@ApiBearerAuth('access-token')
@Controller('submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Get()
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiOperation({
    summary: 'List submissions',
    description: 'Returns paginated submissions. Students only see their own submissions.',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListSubmissionsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedSubmissionsResponseDto>> {
    return this.submissionService.list(user, query);
  }

  @Get(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get a submission by id' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<SubmissionResponseDto>> {
    return this.submissionService.getById(user, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiOperation({ summary: 'Create or submit an assignment submission' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubmissionDto,
  ): Promise<ControllerSuccessPayload<SubmissionResponseDto>> {
    return this.submissionService.create(user, dto);
  }

  @Patch(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update or grade a submission' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubmissionDto,
  ): Promise<ControllerSuccessPayload<SubmissionResponseDto>> {
    return this.submissionService.update(user, id, dto);
  }
}
