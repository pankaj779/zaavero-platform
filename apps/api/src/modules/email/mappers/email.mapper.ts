import type {
  EmailLogRecord,
  EmailQueueRecord,
  EmailTemplateRecord,
} from '../interfaces/email-repository.interface';

export class EmailMapper {
  static pageMeta(total: number, page: number, limit: number) {
    return { total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static log(record: EmailLogRecord) {
    return {
      ...record,
      // Recipients are masked in admin lists; full addresses remain in the
      // tenant-scoped delivery record only.
      to: record.to.map((address) => EmailMapper.maskAddress(address)),
    };
  }

  static queue(record: EmailQueueRecord) {
    return {
      ...record,
      to: record.to.map((address) => EmailMapper.maskAddress(address)),
      variables: undefined,
      renderedHtml: undefined,
      renderedText: undefined,
      headers: undefined,
      attachmentDescriptors: undefined,
    };
  }

  static template(record: EmailTemplateRecord) {
    return {
      id: record.id,
      organizationId: record.organizationId,
      key: record.key,
      locale: record.locale,
      version: record.version,
      subject: record.subject,
      preview: record.preview,
      category: record.category,
      status: record.status,
      variableSchema: record.variableSchema,
    };
  }

  private static maskAddress(address: string): string {
    const [local, domain] = address.split('@');
    if (!local || !domain) return '[REDACTED]';
    return `${local.slice(0, 2)}***@${domain}`;
  }
}
