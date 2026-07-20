import { describe, expect, it, vi } from 'vitest';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import type { HealthService } from './health.service';

describe('AppController', () => {
  const controller = new AppController();

  it('returns root service metadata', () => {
    expect(controller.getRoot()).toEqual({
      service: 'Graphology Platform API',
      status: 'running',
      version: '0.1.0',
    });
  });
});

describe('HealthController', () => {
  const healthService = {
    checkDatabase: vi.fn(() => Promise.resolve({ status: 'up' as const, latencyMs: 1 })),
    getDeepHealth: vi.fn(() =>
      Promise.resolve({
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
        uptimeSeconds: 1,
        checks: {
          database: { status: 'up' as const, latencyMs: 1 },
          providers: [],
        },
      }),
    ),
  } as unknown as HealthService;

  const controller = new HealthController(healthService);

  it('returns health status', () => {
    const response = controller.getHealth();
    expect(response.status).toBe('healthy');
    expect(() => new Date(response.timestamp)).not.toThrow();
  });

  it('returns runtime status', () => {
    const response = controller.getStatus();
    expect(response.status).toBe('running');
    expect(response.uptime).toBeGreaterThanOrEqual(0);
    expect(() => new Date(response.timestamp)).not.toThrow();
  });

  it('returns ready when database is up', async () => {
    const response = await controller.getReady();
    expect(response.status).toBe('ready');
    expect(response.database.status).toBe('up');
  });

  it('returns deep health snapshot', async () => {
    const response = await controller.getDeepHealth();
    expect(response.status).toBe('healthy');
  });
});
