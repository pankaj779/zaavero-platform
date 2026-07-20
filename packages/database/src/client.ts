import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    // Neon / PgBouncer: set connection_limit & pool_timeout on DATABASE_URL
    // e.g. ?pgbouncer=true&connection_limit=5&pool_timeout=10&connect_timeout=15
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/** Used by Nest graceful shutdown / health teardown. */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export type { PrismaClient } from '@prisma/client';
