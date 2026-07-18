import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../config/env.schema';
import { AuthModule } from '../auth/auth.module';
import { STORAGE_PROVIDER_TOKEN, STORAGE_REPOSITORY } from './constants/injection-tokens';
import { StorageController } from './controllers/storage.controller';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import { resolveStorageProvider } from './providers/storage-provider.factory';
import type { StorageProvider } from './providers/storage-provider.interface';
import { SandboxStorageProvider } from './providers/sandbox-storage.provider';
import { PrismaStorageRepository } from './repositories/prisma-storage.repository';
import { StorageService } from './services/storage.service';

@Global()
@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [StorageController],
  providers: [
    CloudinaryStorageProvider,
    SandboxStorageProvider,
    StorageService,
    {
      provide: STORAGE_REPOSITORY,
      useClass: PrismaStorageRepository,
    },
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: (
        configService: ConfigService<EnvConfig, true>,
        cloudinaryProvider: CloudinaryStorageProvider,
        sandboxProvider: SandboxStorageProvider,
      ): StorageProvider =>
        resolveStorageProvider(
          {
            NODE_ENV: configService.get('NODE_ENV', { infer: true }),
            STORAGE_PROVIDER: configService.get('STORAGE_PROVIDER', { infer: true }),
            STORAGE_SANDBOX_MODE: configService.get('STORAGE_SANDBOX_MODE', { infer: true }),
          },
          cloudinaryProvider,
          sandboxProvider,
        ),
      inject: [ConfigService, CloudinaryStorageProvider, SandboxStorageProvider],
    },
  ],
  exports: [StorageService, STORAGE_PROVIDER_TOKEN, STORAGE_REPOSITORY],
})
export class StorageModule {}
