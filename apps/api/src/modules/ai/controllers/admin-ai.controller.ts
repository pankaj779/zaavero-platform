import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { AI_REPOSITORY } from '../constants/injection-tokens';
import { AIAdminUsageQueryDto, OrganizationAIQueryDto } from '../dto/ai.dto';
import type { AIRepository } from '../interfaces/ai-repository.interface';
import { AIInsightsService } from '../services/ai-insights.service';
import { AIService } from '../services/ai.service';
import { assertAIOrganizationAccess } from '../utils/ai-org-access';

@ApiTags('Admin AI')
@ApiBearerAuth('access-token')
@Controller('ai/admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(AUTH_ROLES.admin)
@Permissions(AUTH_PERMISSIONS.aiAdmin)
export class AdminAIController {
  constructor(
    private readonly ai: AIService,
    private readonly insights: AIInsightsService,
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
  ) {}

  @Get('provider/health')
  @ApiOperation({ summary: 'Get configured AI provider health' })
  async providerHealth() {
    return {
      message: 'AI provider health retrieved.',
      data: await this.ai.providerHealth(),
    };
  }

  @Get('quota')
  @ApiOperation({ summary: 'Get AI quota limits and current usage for an admin viewer' })
  async quota(@CurrentUser() user: AuthenticatedUser, @Query() query: OrganizationAIQueryDto) {
    return {
      message: 'AI quota retrieved.',
      data: await this.ai.getQuota(user, query.organizationId),
    };
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get organization AI usage summary' })
  async usage(@CurrentUser() user: AuthenticatedUser, @Query() query: AIAdminUsageQueryDto) {
    assertAIOrganizationAccess(user, query.organizationId);
    const since = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000);
    const summary = await this.repository.getAdminUsageSummary(query.organizationId, since);
    return {
      message: 'AI usage summary retrieved.',
      data: summary,
    };
  }

  @Get('insights/engagement')
  @ApiOperation({ summary: 'Get organization engagement insights for admin AI' })
  async engagement(@CurrentUser() user: AuthenticatedUser, @Query() query: AIAdminUsageQueryDto) {
    return {
      message: 'Engagement insights retrieved.',
      data: await this.insights.getAdminEngagementSummary(user, query.organizationId),
    };
  }
}
