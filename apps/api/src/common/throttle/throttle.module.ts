import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../config/env.schema';

/**
 * Global rate limiting. Auth routes further tighten via @Throttle({ auth: … }).
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => {
        const ttl = config.get('THROTTLE_TTL_MS', { infer: true });
        const limit = config.get('THROTTLE_LIMIT', { infer: true });
        const authLimit = config.get('THROTTLE_AUTH_LIMIT', { infer: true });
        return [
          { name: 'default', ttl, limit },
          { name: 'auth', ttl, limit: authLimit },
        ];
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ThrottleModule {}
