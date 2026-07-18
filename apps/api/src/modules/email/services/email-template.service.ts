import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EMAIL_REPOSITORY } from '../constants/injection-tokens';
import type {
  EmailRepository,
  EmailTemplateRecord,
} from '../interfaces/email-repository.interface';
import { renderTemplate, validateTemplateVariables } from '../templates/template-renderer';

export interface RenderedEmailTemplate {
  template: EmailTemplateRecord;
  subject: string;
  html: string;
  text: string;
  preview: string | null;
}

@Injectable()
export class EmailTemplateService {
  constructor(
    @Inject(EMAIL_REPOSITORY)
    private readonly repository: EmailRepository,
  ) {}

  async resolve(organizationId: string, key: string, locale = 'en'): Promise<EmailTemplateRecord> {
    const template = await this.repository.resolveTemplate(organizationId, key, locale);
    if (!template) {
      throw new NotFoundException(`Active email template "${key}" was not found.`);
    }
    return template;
  }

  async render(
    organizationId: string,
    key: string,
    variables: Record<string, unknown>,
    locale = 'en',
  ): Promise<RenderedEmailTemplate> {
    const template = await this.resolve(organizationId, key, locale);
    validateTemplateVariables(template.variableSchema, variables);
    return {
      template,
      subject: renderTemplate(template.subject, variables),
      html: renderTemplate(template.html, variables, true),
      text: renderTemplate(template.text, variables),
      preview: template.preview ? renderTemplate(template.preview, variables) : null,
    };
  }

  preview(
    organizationId: string,
    key: string,
    variables: Record<string, unknown>,
    locale = 'en',
  ): Promise<RenderedEmailTemplate> {
    return this.render(organizationId, key, variables, locale);
  }
}
