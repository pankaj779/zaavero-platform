import { Injectable } from '@nestjs/common';
import type { PdfProvider, PdfRenderRequest, PdfTemplateName } from '../interfaces/pdf.types';
import { PdfTemplateRegistry } from '../templates/pdf-template.registry';

@Injectable()
export class PdfLibProvider implements PdfProvider {
  constructor(private readonly templates: PdfTemplateRegistry) {}

  render<T extends PdfTemplateName>(request: PdfRenderRequest<T>): Promise<Buffer> {
    return this.templates.render(request);
  }
}
