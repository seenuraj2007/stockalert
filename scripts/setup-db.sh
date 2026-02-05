#!/bin/bash

# Database Setup Script for WhatsApp and Product Settings
# DKS StockAlert

echo "🗄️  Setting up DKS StockAlert database tables..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable not set!"
    echo "Please add your Neon PostgreSQL connection string to .env.local"
    exit 1
fi

echo "📊 Database URL detected"
echo ""

# Run the migration SQL
echo "🔄 Running WhatsApp settings migration..."
psql "$DATABASE_URL" < prisma/migrations/20250205_add_whatsapp_settings/migration.sql 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "✓ whatsapp_settings table created"
    echo "✓ product_settings table created"
    echo "✓ Indexes created"
    echo ""
    echo "🎉 Setup complete! You can now use WhatsApp alerts and Tally import features."
else
    echo "❌ Migration failed. Please check your DATABASE_URL and try again."
    echo ""
    echo "Tip: You can manually run the SQL:"
    echo "  psql \$DATABASE_URL < prisma/migrations/20250205_add_whatsapp_settings/migration.sql"
    exit 1
fi
