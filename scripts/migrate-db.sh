#!/bin/bash

# DKS StockAlert Database Migration Script
# This script applies the new WhatsApp and Product Settings tables

echo "🚀 DKS StockAlert Database Migration"
echo "======================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it first: export DATABASE_URL='your-database-url'"
    exit 1
fi

echo "📋 Migration: Add WhatsApp and Product Settings tables"
echo ""

# Extract connection details from DATABASE_URL
# Format: postgresql://username:password@host/database?sslmode=require
echo "🔌 Connecting to database..."

# Run the migration SQL
psql "$DATABASE_URL" -f prisma/migrations/20250205_add_whatsapp_settings/migration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "New tables created:"
    echo "  - whatsapp_settings"
    echo "  - product_settings"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'npm run dev' to start the application"
    echo "  2. Go to Settings > WhatsApp to configure WhatsApp alerts"
    echo "  3. Go to Settings > Import to use Tally import"
    echo "  4. Visit Settings > Language to switch to Hindi"
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check your DATABASE_URL and try again."
    exit 1
fi
