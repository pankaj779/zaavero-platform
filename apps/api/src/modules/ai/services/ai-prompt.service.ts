import { Inject, Injectable } from '@nestjs/common';
import type { AIFeatureValue } from '../constants/ai.constants';
import { InvalidAIRequestException } from '../exceptions';
import { AI_REPOSITORY } from '../constants/injection-tokens';
import type { AIRepository } from '../interfaces/ai-repository.interface';

@Injectable()
export class AIPromptService {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repository: AIRepository,
  ) {}

  async resolveTemplate(input: {
    feature: AIFeatureValue;
    locale?: string;
  }): Promise<{ systemPrompt: string; userTemplate: string | null; key: string }> {
    const key = input.feature.toLowerCase();
    const template = await this.repository.findActivePromptTemplate(
      key,
      input.feature,
      input.locale ?? 'en',
    );
    if (!template) {
      throw new InvalidAIRequestException(`No active prompt template for feature ${input.feature}.`);
    }
    return {
      key: template.key,
      systemPrompt: template.systemPrompt,
      userTemplate: template.userTemplate,
    };
  }

  renderUserTemplate(template: string | null, variables: Record<string, unknown>): string {
    if (!template) return '';
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
      const value = variables[key];
      if (value === undefined || value === null) return '';
      return typeof value === 'string' ? value : JSON.stringify(value);
    });
  }
}
