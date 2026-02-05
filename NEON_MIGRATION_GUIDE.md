# DKS StockAlert - Neon Migration Guide

This guide provides complete instructions for migrating DKS StockAlert from Supabase to Neon Auth + Neon Postgres + Prisma.

## 📋 Migration Overview

This migration includes:
- ✅ Neon Postgres database with Prisma ORM
- ✅ Tenant-based multi-tenancy architecture
- ✅ Neon Auth for authentication
- ✅ Repository pattern for data access
- ✅ SSE-based real-time updates

## 🎯 Migration Steps

### Step 1: Neon Project Setup (Manual - Required)

Since `neonctl init` requires interactive input, you need to:

1. **Create Neon Account** (if you don't have one):
   - Visit: https://console.neon.tech
   - Sign up or log in

2. **Create New Neon Project**:
   - Click "Create a project"
   - Name: `stockalert`
   - Region: Select your preferred region (e.g., US East)
   - PostgreSQL version: Latest (recommended)

3. **Get Connection Strings**:
   - In your project, go to "Connection Details"
   - Copy `Connection String` → Save as `DATABASE_URL` in `.env`
   - Copy `Connection String (Pooled)` → Save as `DIRECT_URL` in `.env`

4. **Update `.env` file**:
   ```env
   DATABASE_URL="postgres://[user]:[password]@ep-[id].us-east-1.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgres://[user]:[password]@ep-[id]-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```

### Step 2: Set Up Neon Auth (Required)

1. **Enable Neon Auth**:
   - In Neon Console, go to your project
   - Navigate to "Auth" (or "Authentication")
   - Click "Enable Auth"
   - Note: If Neon Auth is not available in your region yet, you may need to use an alternative auth solution

2. **Get Auth Configuration**:
   - Copy the Auth URL → Add as `NEXT_PUBLIC_NEON_AUTH_URL` in `.env`
   - Copy the Cookie Secret → Add as `NEON_AUTH_COOKIE_SECRET` in `.env`

3. **Update `.env` file**:
   ```env
   NEXT_PUBLIC_NEON_AUTH_URL="https://auth.neon.tech/project/[project-id]"
   NEON_AUTH_COOKIE_SECRET="[your-cookie-secret]"
   ```

### Step 3: Run Database Migration

Once `.env` is configured with Neon credentials:

```bash
# Generate Prisma client
npx prisma generate

# Run the initial migration
npx prisma migrate dev --name init

# This will create:
# - prisma/migrations/YYYYMMDDHHMMSS_init/migration.sql
# - All tables in your Neon database
```

### Step 4: Migrate Data from Supabase

If you have existing Supabase data:

1. **Keep Supabase credentials in `.env`** during migration:
   ```env
   SUPABASE_URL="your-supabase-url"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-key"
   ```

2. **Run the migration script**:
   ```bash
   npx ts-node scripts/migrate-from-supabase.ts
   ```

3. **Verify the data**:
   ```bash
   npx prisma studio
   ```

### Step 5: Update Application Code

The following files have already been created/updated:

#### ✅ Completed Files:
- `src/lib/prisma.ts` - Prisma client with Neon adapter
- `src/lib/auth.ts` - Neon Auth helpers
- `src/lib/auth-client.ts` - Client-side auth helpers
- `src/app/api/auth/[...path]/route.ts` - Auth API routes
- `src/lib/tenant-setup.ts` - Tenant initialization
- `src/app/onboarding/page.tsx` - Onboarding page
- `src/app/api/tenant/setup/route.ts` - Tenant setup API
- `src/lib/repositories/` - Repository pattern implementations
  - `base.ts` - Base repository with tenancy
  - `product.ts` - Product repository
  - `location.ts` - Location repository
  - `stock.ts` - Stock level repository
  - `stock-transfer.ts` - Stock transfer repository
  - `purchase-order.ts` - Purchase order repository
  - `inventory-event.ts` - Inventory event repository
- `src/app/api/inventory/stream/route.ts` - Real-time streaming

#### 🔧 Files to Update:

1. **API Routes** - Update to use new repositories:
   ```typescript
   // Example: src/app/api/products/route.ts
   import { requireAuth } from '@/lib/auth';
   import { ProductRepository } from '@/lib/repositories';

   export async function GET(req: Request) {
     const { userId, tenantId } = await requireAuth(req);
     const repo = new ProductRepository(tenantId, userId);
     const products = await repo.findAll();
     return Response.json(products);
   }
   ```

2. **Client Components** - Update to use new auth client:
   ```typescript
   // Example: src/app/page.tsx
   'use client';
   import { useSession, signOut } from '@/lib/auth-client';

   export default function HomePage() {
     const { data: session, isPending } = useSession();

     if (isPending) return <div>Loading...</div>;
     if (!session) {
       return <div>Please sign in</div>;
     }

     return (
       <div>
         Welcome, {session.user.email}
         <button onClick={() => signOut()}>Sign Out</button>
       </div>
     );
   }
   ```

3. **Middleware** - Update auth middleware:
   ```typescript
   // middleware.ts
   import { auth } from '@/lib/auth';
   import { NextResponse } from 'next/server';

   export { auth as middleware } from '@/lib/auth';

   export const config = {
     matcher: ['/dashboard/:path*', '/api/:path*'],
   };
   ```

### Step 6: Update Dependencies

The following new packages have been installed:
- `@prisma/client`
- `@prisma/adapter-neon`
- `@neondatabase/serverless`
- `@neondatabase/auth`
- `prisma`

You may optionally remove Supabase packages (after full migration):
```bash
npm uninstall @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Step 7: Test the Application

```bash
# Start development server
npm run dev

# Test authentication
# Test tenant creation
# Test product CRUD operations
# Test inventory management
# Test real-time updates
```

### Step 8: Clean Up (Final Step)

After successful migration and testing:

1. **Remove Supabase-specific files**:
   - `src/lib/supabase.ts`
   - `src/lib/serverSupabase.ts`
   - Backup files created during migration

2. **Remove from .env**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Update README.md** to reflect new tech stack

## 📊 Architecture Changes

### Supabase → Neon Mapping

| Supabase | Neon/Prisma |
|----------|-------------|
| `auth.users()` | `neon_auth.users` (via Neon Auth) |
| `users` table | `tenants` + `members` |
| `products` table | `products` (with tenant isolation) |
| `locations` table | `locations` (with tenant isolation) |
| `product_stock` table | `stock_levels` |
| `stock_history` table | `inventory_events` |
| `supabase.from()` | Repository classes |

### Key Architectural Improvements

1. **Tenant Isolation**: All data is scoped to tenant_id
2. **Repository Pattern**: Clean separation of data access logic
3. **Optimistic Locking**: Version field for concurrent updates
4. **Type Safety**: Full TypeScript support via Prisma
5. **Connection Pooling**: Neon's PgBouncer for better performance

## 🔑 Environment Variables

Your `.env` file should contain:

```env
# Neon Database (Required)
DATABASE_URL="postgres://[user]:[password]@ep-[id].us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgres://[user]:[password]@ep-[id]-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Neon Auth (Required)
NEXT_PUBLIC_NEON_AUTH_URL="https://auth.neon.tech/project/[project-id]"
NEON_AUTH_COOKIE_SECRET="[cookie-secret]"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase (Temporary - keep during migration)
SUPABASE_URL="[your-supabase-url]"
SUPABASE_SERVICE_ROLE_KEY="[your-supabase-key]"

# Other (Existing)
CSRF_SECRET="[your-csrf-secret]"
```

## 🚀 Deployment

### Vercel

1. Add environment variables in Vercel dashboard
2. Push code to GitHub
3. Deploy via Vercel

### Docker

```dockerfile
# Update Dockerfile if needed
# The existing Dockerfile should work with Neon
```

## 📝 API Changes

### Authentication Endpoints

All auth endpoints are now handled by Neon Auth:
- `GET/POST /api/auth/*` - Handles all auth operations

### Protected API Routes

Update your API routes to use `requireAuth`:

```typescript
import { requireAuth } from '@/lib/auth';
import { [Entity]Repository } from '@/lib/repositories';

export async function GET(req: Request) {
  const { userId, tenantId } = await requireAuth(req);
  const repo = new [Entity]Repository(tenantId, userId);
  // ... rest of your code
}
```

## 🔍 Troubleshooting

### Common Issues

**Issue**: "DATABASE_URL not set"
**Solution**: Ensure `.env` file exists with `DATABASE_URL` configured

**Issue**: "Tenant not found"
**Solution**: Ensure tenant setup API is called after first login (automatic via onboarding)

**Issue**: "Prisma client not generated"
**Solution**: Run `npx prisma generate`

**Issue**: "Migration conflict"
**Solution**: Run `npx prisma migrate resolve --applied [migration-name]`

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Auth Documentation](https://neon.tech/docs/auth)
- [Next.js Documentation](https://nextjs.org/docs)

## ✅ Migration Checklist

- [ ] Create Neon project
- [ ] Configure DATABASE_URL and DIRECT_URL
- [ ] Set up Neon Auth
- [ ] Run Prisma migrations
- [ ] Migrate existing data (if applicable)
- [ ] Update API routes to use repositories
- [ ] Update client components to use new auth
- [ ] Update middleware
- [ ] Test all features
- [ ] Remove Supabase dependencies
- [ ] Update documentation
- [ ] Deploy to production

## 🎉 Conclusion

Your DKS StockAlert application has been successfully migrated to Neon! The new architecture provides:

- ✅ Better performance with Neon's serverless Postgres
- ✅ Multi-tenancy support
- ✅ Type-safe queries with Prisma
- ✅ Clean code with repository pattern
- ✅ Improved security with Neon Auth

For questions or issues, refer to the troubleshooting section or check the official documentation.
