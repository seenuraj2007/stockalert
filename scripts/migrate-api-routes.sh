#!/bin/bash

# Script to migrate API routes from Supabase to Neon Auth

set -e

echo "🔄 Starting API route migration..."

# Pattern replacements
echo "📝 Updating imports and auth patterns..."

# Find all route.ts files in src/app/api
find src/app/api -name "route.ts" -type f | while read file; do
  echo "  Processing: $file"

  # Replace imports - use temp file approach for compatibility
  sed -e "s|import { getUserFromRequest } from '@/lib/auth'|import { getUserFromRequest, requireAuth } from '@/lib/auth'|g" \
      -e "s|import { supabase as globalSupabase } from '@/lib/supabase'|// Removed Supabase - using repositories|g" \
      -e "s|import { supabaseAdmin } from '@/lib/serverSupabase'|// Removed Supabase admin|g" \
      "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"

  # Remove sb-access-token cookie check if present
  sed -i.tmp -e '/const accessToken = req.cookies.get.*sb-access-token/,/return NextResponse.json.*Unauthorized.*status: 401/d' "$file" 2>/dev/null || true
  rm -f "${file}.tmp"
done

echo "✅ Import replacements completed"
echo "⚠️  Note: API routes still need to be updated to use repository pattern manually"
echo "📚 See PRISMA_7_MIGRATION_GUIDE.md for migration examples"
