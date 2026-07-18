import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { EMAIL_PROVIDER, EMAIL_REPOSITORY } from '../constants/injection-tokens';
import type {
  EmailListQueryDto,
  OrganizationEmailQueryDto,
  PreviewEmailTemplateDto,
} from '../dto/email.dto';
import type { EmailRepository } from '../interfaces/email-repository.interface';
import { EmailMapper } from '../mappers/email.mapper';
import type { EmailProvider } from '../providers/email-provider.interface';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';

export function assertEmailOrganizationAccess(
  user: AuthenticatedUser,
  organizationId: string,
): void {
  if (!user.organizationIds.includes(organizationId)) {
    throw new ForbiddenException('You do not have access to this organization.');
  }
}

function resolveOrganization(user: AuthenticatedUser, requested?: string): string {
  if (requested) {
    assertEmailOrganizationAccess(user, requested);
    return requested;
  }
  if (user.organizationIds.length === 1 && user.organizationIds[0]) {
    return user.organizationIds[0];
  }
  throw new ForbiddenException('An organizationId is required.');
}

@Injectable()
export class EmailAdminService {
  constructor(
    @Inject(EMAIL_REPOSITORY)
    private readonly repository: EmailRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly provider: EmailProvider,
    private readonly email: EmailService,
    private readonly templates: EmailTemplateService,
  ) {}

  async listLogs(user: AuthenticatedUser, query: EmailListQueryDto) {
    const organizationId = resolveOrganization(user, query.organizationId);
    const result = await this.repository.listLogs({
      organizationId,
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
    return {
      items: result.items.map((record) => EmailMapper.log(record)),
      meta: EmailMapper.pageMeta(result.total, query.page, query.limit),
    };
  }

  async listQueue(user: AuthenticatedUser, query: EmailListQueryDto) {
    const organizationId = resolveOrganization(user, query.organizationId);
    const result = await this.repository.listQueue({
      organizationId,
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
    return {
      items: result.items.map((record) => EmailMapper.queue(record)),
      meta: EmailMapper.pageMeta(result.total, query.page, query.limit),
    };
  }

  async listTemplates(user: AuthenticatedUser, query: OrganizationEmailQueryDto) {
    const organizationId = resolveOrganization(user, query.organizationId);
    const records = await this.repository.listTemplates(organizationId);
    const unique = new Map(records.map((record) => [`${record.key}:${record.locale}`, record]));
    return [...unique.values()].map((record) => EmailMapper.template(record));
  }

  async preview(user: AuthenticatedUser, dto: PreviewEmailTemplateDto) {
    assertEmailOrganizationAccess(user, dto.organizationId);
    const rendered = await this.templates.preview(
      dto.organizationId,
      dto.key,
      dto.variables,
      dto.locale,
    );
    return {
      template: EmailMapper.template(rendered.template),
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      preview: rendered.preview,
    };
  }

  async cancel(user: AuthenticatedUser, organizationId: string, queueId: string, reason?: string) {
    assertEmailOrganizationAccess(user, organizationId);
    return this.email.cancel(organizationId, queueId, reason);
  }

  async retry(user: AuthenticatedUser, organizationId: string, queueId: string) {
    assertEmailOrganizationAccess(user, organizationId);
    return this.email.retryDeadLetter(organizationId, queueId);
  }

  getProviderStatus() {
    return this.provider.getStatus();
  }

  getStats(user: AuthenticatedUser, query: OrganizationEmailQueryDto) {
    return this.repository.getStats(resolveOrganization(user, query.organizationId));
  }
}
