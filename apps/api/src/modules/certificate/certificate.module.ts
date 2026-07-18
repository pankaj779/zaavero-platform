import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CERTIFICATE_REPOSITORY } from './constants/injection-tokens';
import { CertificateController } from './controllers/certificate.controller';
import { PrismaCertificateRepository } from './repositories/prisma-certificate.repository';
import { CertificateService } from './services/certificate.service';

@Module({
  imports: [AuthModule],
  controllers: [CertificateController],
  providers: [
    CertificateService,
    {
      provide: CERTIFICATE_REPOSITORY,
      useClass: PrismaCertificateRepository,
    },
  ],
  exports: [CertificateService, CERTIFICATE_REPOSITORY],
})
export class CertificateModule {}
