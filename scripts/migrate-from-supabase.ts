import { createClient } from '@supabase/supabase-js';
import { prisma } from '../src/lib/prisma';
import { auth } from '../src/lib/auth';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SupabaseUser {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabaseProduct {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  current_quantity: number;
  reorder_point: number;
  supplier_name: string | null;
  supplier_email: string | null;
  supplier_phone: string | null;
  supplier_id: string | null;
  unit_cost: number;
  selling_price: number;
  unit: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabaseLocation {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface SupabaseProductStock {
  product_id: string;
  location_id: string;
  quantity: number;
}

interface SupabaseStockHistory {
  id: string;
  product_id: string;
  location_id: string | null;
  previous_quantity: number;
  quantity_change: number;
  new_quantity: number;
  change_type: string;
  notes: string | null;
  reference_id: number | null;
  reference_type: string | null;
  created_at: string;
}

interface SupabaseStockTransfer {
  id: string;
  user_id: string;
  from_location_id: string;
  to_location_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabaseStockTransferItem {
  stock_transfer_id: string;
  product_id: string;
  quantity: number;
}

interface SupabasePurchaseOrder {
  id: string;
  user_id: string;
  supplier_id: string;
  order_number: string;
  status: string;
  total_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabasePOItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity: number;
  created_at: string;
}

const userIdMap = new Map<string, string>();
const tenantIdMap = new Map<string, string>();
const productIdMap = new Map<string, string>();
const locationIdMap = new Map<string, string>();
const transferIdMap = new Map<string, string>();
const purchaseOrderIdMap = new Map<string, string>();

async function migrateUsers() {
  console.log('👤 Migrating users...');

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  const supabaseUsers = users as SupabaseUser[];

  for (const user of supabaseUsers) {
    console.log(`  - Migrating user: ${user.email}`);

    const slug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString(36);

    const tenant = await prisma.tenant.upsert({
      where: { slug },
      create: {
        id: user.organization_id || user.id,
        name: `${user.full_name || user.email.split('@')[0]}'s Business`,
        slug,
        ownerId: user.id,
        settings: {
          currency: 'USD',
          timezone: 'UTC',
        },
        isActive: true,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      },
      update: {},
    });

    tenantIdMap.set(user.id, tenant.id);

    await prisma.member.upsert({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id,
        },
      },
      create: {
        tenantId: tenant.id,
        userId: user.id,
        role: (user.role?.toUpperCase() as any) || 'MEMBER',
        status: (user.status?.toUpperCase() as any) || 'ACTIVE',
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      },
      update: {},
    });

    console.log(`      → Tenant ID: ${tenant.id}`);
  }

  console.log(`✅ Migrated ${supabaseUsers.length} users\n`);
}

async function migrateLocations() {
  console.log('📍 Migrating locations...');

  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch locations: ${error.message}`);
  }

  const supabaseLocations = locations as SupabaseLocation[];

  for (const location of supabaseLocations) {
    const tenantId = tenantIdMap.get(location.user_id);
    if (!tenantId) {
      console.log(`  ⚠️  Skipping location ${location.name}: No tenant found for user ${location.user_id}`);
      continue;
    }

    console.log(`  - Migrating location: ${location.name}`);

    const newLocation = await prisma.location.create({
      data: {
        id: location.id,
        tenantId,
        name: location.name,
        type: 'WAREHOUSE',
        address: location.address,
        city: location.city,
        state: location.state,
        zip: location.zip,
        country: location.country,
        isPrimary: location.is_primary,
        isActive: true,
        createdAt: new Date(location.created_at),
        updatedAt: new Date(location.updated_at),
      },
    });

    locationIdMap.set(location.id, newLocation.id);
    console.log(`      → Location ID: ${newLocation.id}`);
  }

  console.log(`✅ Migrated ${supabaseLocations.length} locations\n`);
}

async function migrateProducts() {
  console.log('📦 Migrating products...');

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  const supabaseProducts = products as SupabaseProduct[];

  for (const product of supabaseProducts) {
    const tenantId = tenantIdMap.get(product.user_id);
    if (!tenantId) {
      console.log(`  ⚠️  Skipping product ${product.name}: No tenant found for user ${product.user_id}`);
      continue;
    }

    console.log(`  - Migrating product: ${product.name} (${product.sku || 'no SKU'})`);

    const newProduct = await prisma.product.create({
      data: {
        id: product.id,
        tenantId,
        sku: product.sku || `SKU-${Date.now()}`,
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        unitCost: product.unit_cost || 0,
        sellingPrice: product.selling_price || 0,
        unit: product.unit || 'unit',
        supplierName: product.supplier_name,
        supplierEmail: product.supplier_email,
        supplierPhone: product.supplier_phone,
        imageUrl: product.image_url,
        isActive: true,
        version: 0,
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at),
      },
    });

    productIdMap.set(product.id, newProduct.id);
    console.log(`      → Product ID: ${newProduct.id}`);
  }

  console.log(`✅ Migrated ${supabaseProducts.length} products\n`);
}

async function migrateProductStock() {
  console.log('📊 Migrating product stock...');

  const { data: stockLevels, error } = await supabase
    .from('product_stock')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch product stock: ${error.message}`);
  }

  const supabaseStockLevels = stockLevels as SupabaseProductStock[];

  for (const stock of supabaseStockLevels) {
    const newProductId = productIdMap.get(stock.product_id);
    const newLocationId = locationIdMap.get(stock.location_id);

    if (!newProductId || !newLocationId) {
      console.log(`  ⚠️  Skipping stock mapping: Missing product or location`);
      continue;
    }

    console.log(`  - Migrating stock: Product ${stock.product_id} at Location ${stock.location_id} = ${stock.quantity}`);

    const product = await prisma.product.findUnique({
      where: { id: newProductId },
    });

    if (!product) {
      console.log(`  ⚠️  Skipping stock mapping: Product not found`);
      continue;
    }

    await prisma.stockLevel.upsert({
      where: {
        tenantId_productId_locationId: {
          tenantId: product.tenantId,
          productId: newProductId,
          locationId: newLocationId,
        },
      },
      create: {
        tenantId: product.tenantId,
        productId: newProductId,
        locationId: newLocationId,
        quantity: stock.quantity,
        reservedQuantity: 0,
        reorderPoint: 0,
        version: 0,
      },
      update: {
        quantity: stock.quantity,
      },
    });

    console.log(`      → Stock updated: ${stock.quantity}`);
  }

  console.log(`✅ Migrated ${supabaseStockLevels.length} stock levels\n`);
}

async function migrateStockHistory() {
  console.log('📋 Migrating stock history...');

  const { data: history, error } = await supabase
    .from('stock_history')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch stock history: ${error.message}`);
  }

  const supabaseHistory = history as SupabaseStockHistory[];
  let migrated = 0;

  for (const event of supabaseHistory) {
    const newProductId = productIdMap.get(event.product_id);
    const newLocationId = event.location_id ? locationIdMap.get(event.location_id) : null;

    if (!newProductId) {
      continue;
    }

    const product = await prisma.product.findUnique({
      where: { id: newProductId },
    });

    if (!product) {
      continue;
    }

    await prisma.inventoryEvent.create({
      data: {
        id: event.id,
        tenantId: product.tenantId,
        type: event.change_type.toUpperCase() as any,
        productId: newProductId,
        locationId: newLocationId,
        quantityDelta: event.quantity_change,
        runningBalance: event.new_quantity,
        notes: event.notes,
        referenceType: event.reference_type,
        referenceId: event.reference_id?.toString(),
        userId: product.tenantId,
        createdAt: new Date(event.created_at),
      },
    });

    migrated++;
  }

  console.log(`✅ Migrated ${migrated} stock history events\n`);
}

async function migrateStockTransfers() {
  console.log('📦 Migrating stock transfers...');

  const { data: transfers, error } = await supabase
    .from('stock_transfers')
    .select('*, stock_transfer_items(*)')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch stock transfers: ${error.message}`);
  }

  const supabaseTransfers = transfers as any[];

  for (const transfer of supabaseTransfers) {
    const tenantId = tenantIdMap.get(transfer.user_id);
    const newFromLocationId = locationIdMap.get(transfer.from_location_id);
    const newToLocationId = locationIdMap.get(transfer.to_location_id);

    if (!tenantId || !newFromLocationId || !newToLocationId) {
      console.log(`  ⚠️  Skipping transfer: Missing tenant or locations`);
      continue;
    }

    console.log(`  - Migrating transfer: ${transfer.id}`);

    const newTransfer = await prisma.stockTransfer.create({
      data: {
        id: transfer.id,
        tenantId,
        fromLocationId: newFromLocationId,
        toLocationId: newToLocationId,
        productId: transfer.stock_transfer_items?.[0]?.product_id || '',
        quantity: transfer.stock_transfer_items?.[0]?.quantity || 0,
        status: transfer.status.toUpperCase() as any,
        requestedBy: transfer.user_id,
        notes: transfer.notes,
        createdAt: new Date(transfer.created_at),
        updatedAt: new Date(transfer.updated_at),
      },
    });

    transferIdMap.set(transfer.id, newTransfer.id);
    console.log(`      → Transfer ID: ${newTransfer.id}`);
  }

  console.log(`✅ Migrated ${supabaseTransfers.length} stock transfers\n`);
}

async function migratePurchaseOrders() {
  console.log('🛒 Migrating purchase orders...');

  const { data: pos, error } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*)')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch purchase orders: ${error.message}`);
  }

  const supabasePOs = pos as any[];

  for (const po of supabasePOs) {
    const tenantId = tenantIdMap.get(po.user_id);

    if (!tenantId) {
      console.log(`  ⚠️  Skipping PO: No tenant found`);
      continue;
    }

    console.log(`  - Migrating PO: ${po.order_number}`);

    const newPO = await prisma.purchaseOrder.create({
      data: {
        id: po.id,
        tenantId,
        orderNumber: po.order_number,
        supplierName: `Supplier ${po.id}`,
        status: po.status.toUpperCase() as any,
        totalAmount: po.total_cost || 0,
        notes: po.notes,
        createdAt: new Date(po.created_at),
        updatedAt: new Date(po.updated_at),
      },
    });

    for (const item of po.purchase_order_items || []) {
      const newProductId = productIdMap.get(item.product_id);

      if (!newProductId) {
        continue;
      }

      await prisma.purchaseOrderItem.create({
        data: {
          id: item.id,
          tenantId,
          orderId: newPO.id,
          productId: newProductId,
          quantity: item.quantity,
          unitCost: item.unit_cost,
          totalCost: item.total_cost,
          receivedQty: item.received_quantity,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(),
        },
      });
    }

    purchaseOrderIdMap.set(po.id, newPO.id);
    console.log(`      → PO ID: ${newPO.id}`);
  }

  console.log(`✅ Migrated ${supabasePOs.length} purchase orders\n`);
}

async function main() {
  console.log('🚀 Starting DKS StockAlert migration from Supabase to Neon...\n');

  try {
    await migrateUsers();
    await migrateLocations();
    await migrateProducts();
    await migrateProductStock();
    await migrateStockHistory();
    await migrateStockTransfers();
    await migratePurchaseOrders();

    console.log('✅ Migration completed successfully!\n');

    console.log('📊 Migration Summary:');
    console.log(`  - Users: ${tenantIdMap.size}`);
    console.log(`  - Locations: ${locationIdMap.size}`);
    console.log(`  - Products: ${productIdMap.size}`);
    console.log(`  - Transfers: ${transferIdMap.size}`);
    console.log(`  - Purchase Orders: ${purchaseOrderIdMap.size}`);
    console.log('');

    console.log('⚠️  Next steps:');
    console.log('1. Verify the data in Neon database');
    console.log('2. Update environment variables');
    console.log('3. Run the application with Neon');
    console.log('4. Update any remaining API routes');
    console.log('5. Remove Supabase dependencies');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
