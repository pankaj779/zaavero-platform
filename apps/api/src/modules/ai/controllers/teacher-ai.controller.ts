import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  AIGenerateDto,
  AIListQueryDto,
  IndexAIDocumentDto,
  OrganizationAIQueryDto,
} from '../dto/ai.dto';
import { AIFeatureService } from '../services/ai-feature.service';
import { AIDocumentService } from '../services/ai-document.service';
import { AIInsightsService } from '../services/ai-insights.service';
import { Inject } from '@nestjs/common';
import { AI_REPOSITORY } from '../constants/injection-tokens';
import type { AIRepository } from '../interfaces/ai-repository.interface';
import { AIMapper } from '../mappers/ai.mapper';
import { assertAIOrganizationAccess } from '../utils/ai-org-access';

@ApiTags('Teacher AI')
@ApiBearerAuth('access-token')
@Controller('ai/teacher')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(AUTH_ROLES.teacher, AUTH_ROLES.admin)
@Permissions(AUTH_PERMISSIONS.aiGenerate)
export class TeacherAIController {
  constructor(
    private readonly features: AIFeatureService,
    private readonly documents: AIDocumentService,
    private readonly insights: AIInsightsService,
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate structured AI content for teaching workflows' })
  async generate(@CurrentUser() user: AuthenticatedUser, @Body() dto: AIGenerateDto) {
    return {
      message: 'AI content generated.',
      data: await this.features.generate(user, dto),
    };
  }

  @Post('documents/index')
  @Permissions(AUTH_PERMISSIONS.aiManage)
  @ApiOperation({ summary: 'Index a storage asset for RAG retrieval' })
  async indexDocument(@CurrentUser() user: AuthenticatedUser, @Body() dto: IndexAIDocumentDto) {
    const document = await this.documents.indexMediaAsset({
      organizationId: dto.organizationId,
      requestedById: user.id,
      mediaAssetId: dto.mediaAssetId,
      courseId: dto.courseId,
      lessonId: dto.lessonId,
      assignmentId: dto.assignmentId,
      title: dto.title,
    });
    return {
      message: 'AI document indexing started.',
      data: AIMapper.document(document),
    };
  }

  @Get('documents')
  @Permissions(AUTH_PERMISSIONS.aiManage)
  @ApiOperation({ summary: 'List indexed AI documents' })
  async listDocuments(@CurrentUser() user: AuthenticatedUser, @Query() query: AIListQueryDto) {
    assertAIOrganizationAccess(user, query.organizationId);
    const result = await this.repository.listDocuments({
      organizationId: query.organizationId,
      page: query.page,
      limit: query.limit,
    });
    return {
      message: 'AI documents retrieved.',
      data: AIMapper.documentPage(result, query.page, query.limit),
    };
  }

  @Get('insights/performance')
  @ApiOperation({ summary: 'Summarize student performance from LMS data' })
  async performanceInsights(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrganizationAIQueryDto,
  ) {
    return {
      message: 'Performance insights retrieved.',
      data: await this.insights.getStudentPerformanceInsights(user, query.organizationId),
    };
  }
}
