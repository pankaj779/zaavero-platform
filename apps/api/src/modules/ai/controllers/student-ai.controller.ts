import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  AIChatStreamDto,
  AIConversationListQueryDto,
  AIFeedbackDto,
  AISemanticSearchDto,
  CreateAIConversationDto,
  UpdateAIConversationDto,
} from '../dto/ai.dto';
import { AIService } from '../services/ai.service';
import { AIConversationService } from '../services/ai-conversation.service';
import { AIRetrievalService } from '../services/ai-retrieval.service';
import { AIMapper } from '../mappers/ai.mapper';

@ApiTags('Student AI')
@ApiBearerAuth('access-token')
@Controller('ai/student')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(AUTH_ROLES.student, AUTH_ROLES.teacher, AUTH_ROLES.admin)
@Permissions(AUTH_PERMISSIONS.aiUse)
export class StudentAIController {
  constructor(
    private readonly ai: AIService,
    private readonly conversations: AIConversationService,
    private readonly retrieval: AIRetrievalService,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List AI conversations for the current user' })
  async listConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AIConversationListQueryDto,
  ) {
    return {
      message: 'AI conversations retrieved.',
      data: await this.conversations.list(user, query),
    };
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create an AI conversation' })
  async createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAIConversationDto,
  ) {
    return {
      message: 'AI conversation created.',
      data: await this.conversations.create(user, dto),
    };
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get an AI conversation with messages' })
  async getConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return {
      message: 'AI conversation retrieved.',
      data: await this.conversations.get(user, organizationId, id),
    };
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update an AI conversation' })
  async updateConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAIConversationDto,
  ) {
    return {
      message: 'AI conversation updated.',
      data: await this.conversations.update(user, dto.organizationId, id, dto),
    };
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Soft-delete an AI conversation' })
  async deleteConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return {
      message: 'AI conversation deleted.',
      data: await this.conversations.remove(user, organizationId, id),
    };
  }

  @Post('chat/stream')
  @ApiOperation({ summary: 'Stream an AI chat response over SSE' })
  async streamChat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AIChatStreamDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const abort = new AbortController();
    const onClose = () => {
      abort.abort();
      if (!res.writableEnded) res.end();
    };
    req.on('close', onClose);
    try {
      await this.ai.streamChat(user, res, dto, abort.signal);
    } finally {
      req.off('close', onClose);
    }
  }

  @Get('quota')
  @ApiOperation({ summary: 'Get current AI quota usage for the signed-in user' })
  async quota(
    @CurrentUser() user: AuthenticatedUser,
    @Query('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return {
      message: 'AI quota retrieved.',
      data: await this.ai.getQuota(user, organizationId),
    };
  }

  @Post('messages/:id/feedback')
  @ApiOperation({ summary: 'Submit feedback for an AI message' })
  async feedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) messageId: string,
    @Body() dto: AIFeedbackDto,
  ) {
    return {
      message: 'AI feedback saved.',
      data: await this.ai.submitFeedback(user, dto.organizationId, messageId, dto),
    };
  }

  @Post('search')
  @ApiOperation({ summary: 'Semantic search over indexed AI documents' })
  async search(@CurrentUser() user: AuthenticatedUser, @Body() dto: AISemanticSearchDto) {
    const hits = await this.retrieval.search({
      organizationId: dto.organizationId,
      userId: user.id,
      query: dto.query,
      courseId: dto.courseId,
      lessonId: dto.lessonId,
    });
    return {
      message: 'Semantic search completed.',
      data: hits.map((hit) => AIMapper.searchHit(hit)),
    };
  }
}
