import { PrismaNeon } from '@prisma/adapter-neon';
import { neon, neonConfig, PoolConfig } from '@neondatabase/serverless';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// CRITICAL for Node.js < v22: WebSocket polyfill
neonConfig.webSocketConstructor = ws;

const neonUrl = process.env.DATABASE_URL;
if (!neonUrl) {
  throw new Error('DATABASE_URL not set in environment variables');
}

// Create PoolConfig for PrismaNeon
const poolConfig: PoolConfig = {
  connectionString: neonUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Create PrismaNeon adapter with pool config
const adapter = new PrismaNeon(poolConfig);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}) as PrismaClient & {
  $disconnect: () => Promise<void>;
};

export default prisma;
