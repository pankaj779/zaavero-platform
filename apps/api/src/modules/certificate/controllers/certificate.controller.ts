import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { AUTH_PERMISSIONS, AUTH_ROLES } from '../../auth/constants/auth.constants';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  CertificateResponseDto,
  PaginatedCertificatesResponseDto,
} from '../dto/certificate-response.dto';
import { IssueCertificateDto } from '../dto/issue-certificate.dto';
import { ListCertificatesQueryDto } from '../dto/list-certificates-query.dto';
import { UpdateCertificateDto } from '../dto/update-certificate.dto';
import { CertificateService } from '../services/certificate.service';

@ApiTags('Certificates')
@ApiBearerAuth('access-token')
@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get()
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiOperation({
    summary: 'List certificates',
    description: 'Returns paginated certificates. Students only see their own certificates.',
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCertificatesQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedCertificatesResponseDto>> {
    return this.certificateService.list(user, query);
  }

  @Get('verify/:verificationCode')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'verificationCode' })
  @ApiOperation({ summary: 'Verify a certificate by verification code' })
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Param('verificationCode') verificationCode: string,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    return this.certificateService.verifyByCode(user, verificationCode);
  }

  @Get(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher, AUTH_ROLES.student)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get a certificate by id' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    return this.certificateService.getById(user, id);
  }

  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseCreate)
  @ApiOperation({ summary: 'Issue a certificate' })
  issue(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: IssueCertificateDto,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    return this.certificateService.issue(user, dto);
  }

  @Patch(':id')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Update a certificate (limited fields)' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCertificateDto,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    return this.certificateService.update(user, id, dto);
  }

  @Post(':id/regenerate-pdf')
  @HttpCode(HttpStatus.OK)
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({
    summary: 'Regenerate the certificate PDF and QR code',
    description: 'Forces a fresh render and upload; the stored URLs are replaced. Audited.',
  })
  regeneratePdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    return this.certificateService.regeneratePdf(user, id);
  }

  @Post(':id/revoke')
  @Roles(AUTH_ROLES.admin, AUTH_ROLES.teacher)
  @Permissions(AUTH_PERMISSIONS.courseUpdate)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Revoke a certificate' })
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ControllerSuccessPayload<CertificateResponseDto>> {
    return this.certificateService.revoke(user, id);
  }
}
