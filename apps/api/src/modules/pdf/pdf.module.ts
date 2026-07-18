import { Global, Module } from '@nestjs/common';
import { PDF_LIB } from './constants/pdf.constants';
import { PublicCertificateController } from './controllers/public-certificate.controller';
import { PdfLibProvider } from './providers/pdf-lib.provider';
import { CertificateVerificationService } from './services/certificate-verification.service';
import { PdfService } from './services/pdf.service';
import { QrService } from './services/qr.service';
import { PdfTemplateRegistry } from './templates/pdf-template.registry';

@Global()
@Module({
  controllers: [PublicCertificateController],
  providers: [
    PdfTemplateRegistry,
    PdfLibProvider,
    QrService,
    CertificateVerificationService,
    PdfService,
    {
      provide: PDF_LIB,
      useExisting: PdfLibProvider,
    },
  ],
  exports: [PdfService, QrService, PDF_LIB],
})
export class PdfModule {}
