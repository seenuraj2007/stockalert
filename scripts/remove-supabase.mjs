#!/usr/bin/env node

/**
 * DKS StockAlert - Supabase Removal Script
 * Cleans up all Supabase references and prepares for Neon Auth
 */

import fs from 'fs';
import path from 'path';

const BACKUP_DIR = '.supabase-backup';

// Files to remove or comment out
const FILES_TO_REMOVE = [
  'src/lib/supabase.ts',
  'src/lib/serverSupabase.ts',
];

// Import patterns to remove
const IMPORT_PATTERNS = [
  /import\s+\{\s*supabase[^}]*\}\s+from\s+['"]@\/lib\/supabase['"]/g,
  /import\s+\{\s*supabaseAdmin[^}]*\}\s+from\s+['"]@\/lib\/serverSupabase['"]/g,
  /import\s+\{[^}]*getUserFromRequest[^}]*\}\s+from\s+['"]@\/lib\/auth['"]/g,
];

// Code patterns to remove/comment
const CODE_PATTERNS = [
  /const\s+accessToken\s*=\s*req\.cookies\.get\(['"]sb-access-token['"]\)\?\.value.*?return\s+NextResponse\.json\(\{\s*error:\s*['"]Unauthorized['"]\s*\},\s*\{\s*status:\s*401\s*\}\)/gs,
];

console.log('🧹 Cleaning up Supabase references...\n');

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`✓ Created backup directory: ${BACKUP_DIR}`);
}

// Backup and remove Supabase files
FILES_TO_REMOVE.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const backupPath = path.join(BACKUP_DIR, path.basename(file));
    fs.copyFileSync(fullPath, backupPath);
    fs.unlinkSync(fullPath);
    console.log(`✓ Removed ${file} (backup saved)`);
  }
});

// Process API routes
const apiDir = path.join(process.cwd(), 'src/app/api');
if (fs.existsSync(apiDir)) {
  const processDirectory = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        processDirectory(fullPath);
      } else if (entry.name === 'route.ts') {
        processFile(fullPath);
      }
    }
  };

  processDirectory(apiDir);
}

console.log('\n✅ Cleanup complete!');
console.log('\n📋 Next steps:');
console.log('   1. Update API routes to use repository pattern (see API_ROUTE_TEMPLATE.ts)');
console.log('   2. Update client components to use Neon Auth');
console.log('   3. Test authentication flow');
console.log('   4. Remove @supabase packages when ready');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove Supabase imports
    IMPORT_PATTERNS.forEach(pattern => {
      const newContent = content.replace(pattern, (match) => {
        if (match.includes('getUserFromRequest')) {
          // Replace with new import
          return "import { getUserFromRequest, requireAuth } from '@/lib/auth'";
        }
        return '// ' + match;
      });
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    // Comment out Supabase code
    content = content.replace(
      /\b(globalSupabase|supabase)\b/g,
      '/* REMOVED: globalSupabase */ TODO: Use repository instead'
    );
    content = content.replace(
      /\b(supabaseAdmin)\b/g,
      '/* REMOVED: supabaseAdmin */ TODO: Use repository instead'
    );

    // Comment out cookie checks
    if (content.includes('sb-access-token')) {
      content = content.replace(
        /const\s+accessToken.*?sb-access-token.*?\n/g,
        '// TODO: Remove sb-access-token check (handled by Neon Auth)\n'
      );
      modified = true;
    }

    if (modified) {
      const backupPath = path.join(BACKUP_DIR, filePath.replace(process.cwd() + '/', '').replace(/\//g, '_'));
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.copyFileSync(filePath, backupPath);

      fs.writeFileSync(filePath, content);
      console.log(`✓ Processed: ${filePath.replace(process.cwd() + '/', '')}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}
