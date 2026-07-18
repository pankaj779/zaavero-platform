import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EMAIL_REPOSITORY } from '../constants/injection-tokens';
import type {
  EmailCategoryValue,
  EmailPreferenceRecord,
  EmailRepository,
} from '../interfaces/email-repository.interface';

export type PreferenceUpdate = Partial<
  Pick<
    EmailPreferenceRecord,
    | 'marketing'
    | 'announcements'
    | 'assignments'
    | 'courses'
    | 'payments'
    | 'certificates'
    | 'liveClasses'
    | 'system'
    | 'digestMode'
  >
>;

const defaults: Omit<
  EmailPreferenceRecord,
  'id' | 'organizationId' | 'userId' | 'createdAt' | 'updatedAt'
> = {
  marketing: false,
  announcements: true,
  assignments: true,
  courses: true,
  payments: true,
  certificates: true,
  liveClasses: true,
  system: true,
  digestMode: 'IMMEDIATE',
};

const categoryField: Partial<Record<EmailCategoryValue, keyof PreferenceUpdate>> = {
  SYSTEM: 'system',
  MARKETING: 'marketing',
  ANNOUNCEMENT: 'announcements',
  ASSIGNMENT: 'assignments',
  COURSE: 'courses',
  PAYMENT: 'payments',
  CERTIFICATE: 'certificates',
  LIVE_CLASS: 'liveClasses',
};

@Injectable()
export class EmailPreferenceService {
  constructor(
    @Inject(EMAIL_REPOSITORY)
    private readonly repository: EmailRepository,
  ) {}

  async get(organizationId: string, userId: string) {
    const preference = await this.repository.getPreference(organizationId, userId);
    return { ...(preference ?? defaults), security: true as const };
  }

  async update(
    organizationId: string,
    userId: string,
    data: PreferenceUpdate & { security?: boolean },
  ) {
    if (data.security === false) {
      throw new BadRequestException('Security emails cannot be disabled.');
    }
    const { security: _security, ...stored } = data;
    const preference = await this.repository.upsertPreference(organizationId, userId, stored);
    return { ...preference, security: true as const };
  }

  async isEnabled(
    organizationId: string,
    userId: string | undefined,
    category: EmailCategoryValue,
  ): Promise<boolean> {
    if (category === 'SECURITY' || !userId) return true;
    const preference = await this.repository.getPreference(organizationId, userId);
    const field = categoryField[category];
    return field ? Boolean((preference ?? defaults)[field]) : true;
  }
}
