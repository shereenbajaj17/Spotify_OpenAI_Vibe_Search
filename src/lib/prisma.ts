import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaInstance: PrismaClient | undefined;
}

/**
 * Lazily creates the PrismaClient only when the first database call is made.
 * This prevents Prisma 6 from attempting a DB connection during `next build`,
 * which would fail because the DB isn't accessible from the build server.
 */
function getInstance(): PrismaClient {
  if (!global.prismaInstance) {
    global.prismaInstance = new PrismaClient({ log: [] });
  }
  return global.prismaInstance;
}

// Proxy-based lazy singleton: the PrismaClient is NOT created at import time.
// It is only created the first time a property/method is accessed (e.g. prisma.track.findMany).
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const instance = getInstance();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
