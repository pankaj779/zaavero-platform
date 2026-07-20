import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { LegacyHealthController } from './legacy-health.controller';

@Module({
  controllers: [AppController, HealthController, LegacyHealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
