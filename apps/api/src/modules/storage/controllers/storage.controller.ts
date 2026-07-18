import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { ControllerSuccessPayload } from '../../../common/interfaces/api-response.interface';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  DeleteStorageAssetQueryDto,
  FinalizeStorageUploadDto,
  GetStorageAssetQueryDto,
  ListStorageAssetsQueryDto,
  MultipartUploadBodyDto,
  ReplaceStorageAssetDto,
  ServerStorageUploadDto,
  SignStorageUploadDto,
} from '../dto/storage.dto';
import type {
  MediaAssetResponseDto,
  PaginatedMediaAssetsResponseDto,
  SignedUploadResponseDto,
  StorageProviderStatusResponseDto,
} from '../dto/storage-response.dto';
import { StorageService, type UploadedFileInput } from '../services/storage.service';

// Hard multipart cap; the service enforces the configured per-request limit.
const MULTIPART_MAX_BYTES = 50 * 1024 * 1024;

@ApiTags('Storage')
@ApiBearerAuth('access-token')
@Controller('storage')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('uploads/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create signed direct-upload parameters',
    description:
      'Returns provider signed-upload parameters for a browser direct upload. The API secret never leaves the server.',
  })
  sign(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SignStorageUploadDto,
  ): ControllerSuccessPayload<SignedUploadResponseDto> {
    return {
      message: 'Signed upload created.',
      data: this.storageService.createSignedUpload(user, dto),
    };
  }

  @Post('uploads/finalize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Finalize a direct upload',
    description:
      'Verifies the uploaded asset with the provider and persists its metadata as a MediaAsset.',
  })
  async finalize(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: FinalizeStorageUploadDto,
  ): Promise<ControllerSuccessPayload<MediaAssetResponseDto>> {
    return {
      message: 'Upload finalized.',
      data: await this.storageService.finalizeDirectUpload(user, dto),
    };
  }

  @Post('uploads')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MULTIPART_MAX_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: MultipartUploadBodyDto })
  @ApiOperation({
    summary: 'Upload a small file through the server',
    description: 'Multipart server-side upload for small or server-generated files.',
  })
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ServerStorageUploadDto,
    @UploadedFile() file?: UploadedFileInput,
  ): Promise<ControllerSuccessPayload<MediaAssetResponseDto>> {
    return {
      message: 'File uploaded.',
      data: await this.storageService.uploadBuffer(user, dto, file),
    };
  }

  @Get('provider/status')
  @ApiOperation({ summary: 'Get active storage provider status' })
  providerStatus(): ControllerSuccessPayload<StorageProviderStatusResponseDto> {
    return {
      message: 'Storage provider status retrieved.',
      data: this.storageService.getProviderStatus(),
    };
  }

  @Get('assets')
  @ApiOperation({ summary: 'List media assets by organization and entity' })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListStorageAssetsQueryDto,
  ): Promise<ControllerSuccessPayload<PaginatedMediaAssetsResponseDto>> {
    return {
      message: 'Media assets retrieved.',
      data: await this.storageService.listAssets(user, query),
    };
  }

  @Get('assets/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get media asset metadata' })
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetStorageAssetQueryDto,
  ): Promise<ControllerSuccessPayload<MediaAssetResponseDto>> {
    return {
      message: 'Media asset retrieved.',
      data: await this.storageService.getAsset(user, query.organizationId, id),
    };
  }

  @Post('assets/:id/replace')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MULTIPART_MAX_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Replace the file behind a media asset' })
  async replace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceStorageAssetDto,
    @UploadedFile() file?: UploadedFileInput,
  ): Promise<ControllerSuccessPayload<MediaAssetResponseDto>> {
    return {
      message: 'Media asset replaced.',
      data: await this.storageService.replaceAsset(user, dto.organizationId, id, file),
    };
  }

  @Delete('assets/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Delete a media asset (soft delete + provider removal)' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteStorageAssetQueryDto,
  ): Promise<ControllerSuccessPayload<{ deleted: boolean }>> {
    return {
      message: 'Media asset deleted.',
      data: await this.storageService.deleteAsset(user, query.organizationId, id),
    };
  }
}
