# DKS StockAlert - Neon Migration Guide (Prisma 7)

This guide provides complete instructions for migrating DKS StockAlert from Supabase to Neon Auth + Neon Postgres + **Prisma 7**.

## 📋 What's New in Prisma 7

### Critical Changes from Prisma 6

1. **`prisma.config.ts` is REQUIRED** - No longer optional
2. **DataSource URLs moved to config** - Keep provider in schema.prisma, URL in config
3. **No preview features needed** - driverAdapters and queryCompiler are now stable
4. **WebSocket polyfill for Node.js < v22** - Required for Neon serverless driver
5. **Output location changes** - Client is generated to `./node_modules/@prisma/client`

## 🎯 Migration Steps

### Step 1: Verify Prerequisites

```bash
# Check Node version (must be v19+)
node --version

# Check Prisma version (should be 7.x)
npx prisma --version

# Output should show:
# prisma               : 7.x.0
# @prisma/client       : 7.x.0
```

### Step 2: Install Dependencies

```bash
# Core Prisma and Neon packages
npm install prisma@latest @prisma/client@latest @prisma/adapter-neon @neondatabase/serverless @neondatabase/auth

# WebSocket polyfill for Node.js < v22
npm install ws @types/ws

# Development dependencies
npm install -D dotenv typescript
```

### Step 3: Configure Prisma 7

#### A. Create `prisma.config.ts` (NEW - REQUIRED)

```typescript
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL!,
  },
});
```

**Key Points:**
- ✅ This file is REQUIRED in Prisma 7 (cannot be optional)
- ✅ Use `dotenv.config()` to load .env variables
- ✅ `earlyAccess: true` enables Prisma 7 features
- ✅ URL is now in config, NOT in schema.prisma

#### B. Update `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// Only keep provider here - URL is in prisma.config.ts
// This is different from Prisma 6 where url was here
```

**Key Changes from Prisma 6:**
- ❌ Removed `url = env("DATABASE_URL")` from datasource
- ❌ Removed `directUrl = env("DIRECT_URL")` from datasource  
- ❌ Removed `previewFeatures = ["driverAdapters", "queryCompiler"]` from generator
- ✅ Keep only `provider = "postgresql"` in datasource

### Step 4: Neon Project Setup

#### Option A: Manual Setup (Recommended)

1. **Create Neon Account**: https://console.neon.tech
2. **Create Project**: Name it "stockalert"
3. **Get Connection Strings**:
   - Go to "Connection Details"
   - Copy "Neon Serverless Driver" string → `DATABASE_URL` in `.env`
   
4. **Enable Neon Auth**:
   - Go to "Auth" section
   - Click "Set up Auth"
   - Copy Auth URL → `NEXT_PUBLIC_NEON_AUTH_URL` in `.env`
   - Generate Cookie Secret → `NEON_AUTH_COOKIE_SECRET` in `.env`

#### Option B: CLI Setup

```bash
npx neonctl@latest init
```

This creates a project and saves credentials to `.env`.

### Step 5: Configure Environment Variables

Update `.env` file:

```env
# Neon Database (from neonctl or console)
DATABASE_URL="postgresql://neondb_owner:xxx@ep-xxx.pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Neon Auth (from console)
NEXT_PUBLIC_NEON_AUTH_URL="https://ep-xxx.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth"
NEON_AUTH_COOKIE_SECRET="generate-a-secure-random-string-here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase (keep during migration)
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# Other
CSRF_SECRET=""
```

**Important Notes:**
- Use the **pooled** connection with `pooler` in hostname for production
- The Cookie Secret should be a long, random string (32+ characters)
- Keep Supabase credentials during migration period

### Step 6: Prisma Client Setup (Prisma 7 + Neon)

Create or update `src/lib/prisma.ts`:

```typescript
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// CRITICAL for Node.js < v22: WebSocket polyfill
neonConfig.webSocketConstructor = ws;

const neonUrl = process.env.DATABASE_URL;
if (!neonUrl) {
  throw new Error('DATABASE_URL not set in environment variables');
}

const pool = new Pool({
  connectionString: neonUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaNeon(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export type { PrismaClient } from '@prisma/client';

process.on('beforeExit', async () => {
  await pool.end();
});

export default prisma;
```

**Prisma 7 Specific Notes:**
- ✅ Import from `@prisma/client` (not custom paths)
- ✅ WebSocket polyfill required for Node.js < v22
- ✅ Pool options tuned for serverless/edge
- ✅ Graceful shutdown with `pool.end()`

### Step 7: Run Prisma Commands

```bash
# Generate Prisma Client (reads from prisma.config.ts)
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init

# Verify schema
npx prisma validate

# Open Prisma Studio
npx prisma studio

# (Optional) Pull schema from existing database
npx prisma db pull
```

### Step 8: Neon Auth Integration

#### Server-side (`src/lib/auth.ts`)

```typescript
import { createAuthClient } from '@neondatabase/auth';

export const auth = createAuthClient({
  url: process.env.NEXT_PUBLIC_NEON_AUTH_URL!,
  cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET!,
});

export async function getCurrentUserId(req: Request): Promise<string | null> {
  const session = await auth.getSession(req);
  return session?.user?.id || null;
}

export async function requireAuth(req: Request) {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}
```

#### Client-side (`src/lib/auth-client.ts`)

```typescript
'use client';
import { createAuthClient } from '@neondatabase/auth/client';

export const authClient = createAuthClient({
  url: process.env.NEXT_PUBLIC_NEON_AUTH_URL!,
});

export const { signIn, signOut, useSession } = authClient;
```

#### API Routes (`app/api/auth/[...path]/route.ts`)

```typescript
import { auth } from '@/lib/auth';

export const GET = auth.handler;
export const POST = auth.handler;
```

### Step 9: Use Repositories in API Routes

```typescript
import { requireAuth } from '@/lib/auth';
import { ProductRepository } from '@/lib/repositories';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await requireAuth(req);
    const tenantId = req.headers.get('x-tenant-id') || '';
    
    const repo = new ProductRepository(tenantId, userId);
    const products = await repo.findAll();
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 📊 Prisma 7 vs Prisma 6 Reference

| Feature | Prisma 6 | Prisma 7 |
|---------|----------|----------|
| Config File | Optional | **REQUIRED** |
| DataSource URL | In schema.prisma | In prisma.config.ts |
| Preview Features | driverAdapters, queryCompiler | Not needed (stable) |
| WebSocket Polyfill | Sometimes needed | **Always needed for Node.js < v22** |
| Output Location | Customizable | `./node_modules/@prisma/client` |
| Direct URL | In schema | Removed (handled by config) |
| MongoDB | Supported | **Not supported** |

## 🔍 Troubleshooting

### Error: "prisma.config.ts not found"

**Solution:** Create `prisma.config.ts` in project root with `defineConfig()`

### Error: "WebSocket is not defined"

**Solution:** 
```typescript
import ws from 'ws';
neonConfig.webSocketConstructor = ws;
```

### Error: "Cannot find module '@prisma/client'"

**Solution:** 
```bash
npx prisma generate
```

### Error: "Connection pool is full"

**Solution:** Reduce max in Pool config:
```typescript
const pool = new Pool({
  max: 5, // Try 5 instead of 10
  idleTimeoutMillis: 20000,
});
```

### Error: "Validation Error: Missing opposite relation field"

**Solution:** Ensure relations have fields on both models:
```prisma
model Product {
  inventoryEvents InventoryEvent[]
}

model InventoryEvent {
  product Product @relation(fields: [productId], references: [id])
}
```

### Warning: "Preview feature is deprecated"

**Solution:** Remove `previewFeatures` from generator block (already done in updated schema)

## 🚀 Migration Commands

```bash
# 1. Install dependencies
npm install prisma@latest @prisma/client@latest @prisma/adapter-neon @neondatabase/serverless ws

# 2. Create prisma.config.ts (see Step 3A)

# 3. Update prisma/schema.prisma (remove url, keep provider)

# 4. Configure .env with DATABASE_URL

# 5. Generate client
npx prisma generate

# 6. Run migrations
npx prisma migrate dev --name init

# 7. Verify
npx prisma validate
npx prisma studio
```

## 📝 Summary of Changes

### New Files Created

1. `prisma.config.ts` - Prisma 7 configuration (REQUIRED)
2. All repository files in `src/lib/repositories/`
3. All auth and tenant setup files

### Modified Files

1. `prisma/schema.prisma` - Removed URL and preview features
2. `src/lib/prisma.ts` - Added ws polyfill and updated imports
3. `.env` - Added Neon credentials

### Files to Remove (After Migration)

1. `src/lib/supabase.ts`
2. `src/lib/serverSupabase.ts`
3. Supabase migration files (optional)

## ✅ Verification Checklist

- [ ] Node.js is v19 or higher
- [ ] Prisma is version 7.x
- [ ] `prisma.config.ts` exists and is valid
- [ ] `prisma/schema.prisma` has no URL in datasource
- [ ] WebSocket polyfill is configured in `src/lib/prisma.ts`
- [ ] `npx prisma generate` runs without errors
- [ ] `npx prisma validate` passes
- [ ] Environment variables are configured
- [ ] Database connection works

## 🎉 Next Steps

After completing Prisma 7 setup:

1. **Run Migrations**: `npx prisma migrate dev --name init`
2. **Migrate Data** (if applicable): `npx ts-node scripts/migrate-from-supabase.ts`
3. **Update API Routes** to use new repositories
4. **Update Client Components** to use new auth client
5. **Test Thoroughly** - All CRUD operations, auth, real-time
6. **Deploy** with environment variables configured

## 📚 Additional Resources

- [Prisma 7 Documentation](https://www.prisma.io/docs/guides/getting-started/hello-world)
- [Neon Documentation](https://neon.tech/docs)
- [Neon Auth Documentation](https://neon.tech/docs/auth)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/guides/upgrade-to-prisma-7)

---

**Status**: Prisma 7 migration complete ✅ | Ready for database creation ⏳
