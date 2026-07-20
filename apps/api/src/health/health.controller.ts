import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService, type DeepHealthResponse } from './health.service';

interface HealthResponse {
  status: string;
  timestamp: string;
}

interface StatusResponse {
  status: string;
  uptime: number;
  timestamp: string;
}

interface ReadyResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  database: { status: 'up' | 'down'; latencyMs?: number };
}

@ApiTags('Health')
@SkipThrottle()
@Controller({
  path: '',
  version: '1',
})
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness health check' })
  getHealth(): HealthResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Runtime status check' })
  getStatus(): StatusResponse {
    return {
      status: 'running',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (database connectivity)' })
  async getReady(): Promise<ReadyResponse> {
    const database = await this.healthService.checkDatabase();
    if (database.status === 'down') {
      throw new HttpException(
        {
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          database,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      database,
    };
  }

  @Get('health/deep')
  @ApiOperation({ summary: 'Deep health: database + provider configuration snapshot' })
  async getDeepHealth(): Promise<DeepHealthResponse> {
    const deep = await this.healthService.getDeepHealth();
    if (deep.status === 'unhealthy') {
      throw new HttpException(deep, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return deep;
  }
}
