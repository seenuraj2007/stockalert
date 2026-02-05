import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  console.error('Please check your .env file')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function migrate() {
  try {
    console.log('🚀 Running database migration...\n')
    
    // Create WhatsApp Settings table
    await sql`
      CREATE TABLE IF NOT EXISTS whatsapp_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id TEXT NOT NULL UNIQUE,
          enabled BOOLEAN NOT NULL DEFAULT false,
          phone_number TEXT,
          notify_low_stock BOOLEAN NOT NULL DEFAULT true,
          notify_out_of_stock BOOLEAN NOT NULL DEFAULT true,
          notify_purchase_orders BOOLEAN NOT NULL DEFAULT true,
          notify_daily_summary BOOLEAN NOT NULL DEFAULT false,
          language TEXT NOT NULL DEFAULT 'en',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ whatsapp_settings table created')
    
    // Create Product Settings table
    await sql`
      CREATE TABLE IF NOT EXISTS product_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id TEXT NOT NULL UNIQUE,
          default_reorder_point INTEGER NOT NULL DEFAULT 10,
          default_unit TEXT NOT NULL DEFAULT 'PCS',
          enable_barcodes BOOLEAN NOT NULL DEFAULT true,
          track_expiry_dates BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ product_settings table created')
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_tenant_id ON whatsapp_settings(tenant_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_product_settings_tenant_id ON product_settings(tenant_id)`
    console.log('✅ Indexes created')
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('\nNew tables created:')
    console.log('  - whatsapp_settings')
    console.log('  - product_settings')
    console.log('\nNext steps:')
    console.log('  1. Run: npm run dev')
    console.log('  2. Visit: http://localhost:3000/settings')
    console.log('  3. Configure WhatsApp alerts')
    console.log('  4. Try Tally import feature')
    console.log('  5. Switch language to Hindi')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
