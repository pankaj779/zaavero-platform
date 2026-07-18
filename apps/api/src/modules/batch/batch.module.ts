import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BATCH_REPOSITORY } from './constants/injection-tokens';
import { BatchController } from './controllers/batch.controller';
import { PrismaBatchRepository } from './repositories/prisma-batch.repository';
import { BatchService } from './services/batch.service';

@Module({
  imports: [AuthModule],
  controllers: [BatchController],
  providers: [
    BatchService,
    {
      provide: BATCH_REPOSITORY,
      useClass: PrismaBatchRepository,
    },
  ],
  exports: [BatchService, BATCH_REPOSITORY],
})
export class BatchModule {}
