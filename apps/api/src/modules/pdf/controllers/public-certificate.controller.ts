import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { CertificateVerificationResponseDto } from '../dto/certificate-verification-response.dto';
import { CertificateVerificationService } from '../services/certificate-verification.service';

/** Public certificate verification. Deliberately unauthenticated. */
@ApiTags('Public')
@Controller('public/certificates')
export class PublicCertificateController {
  constructor(private readonly verification: CertificateVerificationService) {}

  @Get('verify/:verificationCode')
  @ApiParam({ name: 'verificationCode' })
  @ApiOperation({
    summary: 'Verify a certificate by its QR verification code',
    description:
      'No authentication required. Returns VALID, REVOKED, or NOT_FOUND with display-only fields; internal identifiers are never exposed.',
  })
  async verify(
    @Param('verificationCode') verificationCode: string,
  ): Promise<ControllerSuccessPayload<CertificateVerificationResponseDto>> {
    const data = await this.verification.verify(verificationCode);
    return {
      message:
        data.status === 'VALID'
          ? 'Certificate is valid.'
          : data.status === 'REVOKED'
            ? 'Certificate has been revoked.'
            : 'Certificate not found.',
      data,
    };
  }
}
