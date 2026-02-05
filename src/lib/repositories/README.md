# Repository Pattern Documentation

This directory contains all repository classes for DKS StockAlert data access.

## Overview

The repository pattern provides a clean abstraction layer between the application logic and the database. All repositories:

- Enforce tenant isolation automatically
- Use optimistic locking for concurrent updates
- Provide type-safe operations
- Include comprehensive error handling

## Base Repository

All repositories extend `BaseRepository`, which provides:

- **Automatic tenant filtering**: All queries are scoped to `tenantId`
- **User context**: Track `userId` for audit trails
- **Transaction support**: Execute operations within transactions
- **Error handling**: Centralized error logging

### Usage Pattern

```typescript
import { requireAuth } from '@/lib/auth';
import { ProductRepository } from '@/lib/repositories';

// In API routes
export async function GET(req: Request) {
  const { userId, tenantId } = await requireAuth(req);
  const repo = new ProductRepository(tenantId, userId);

  const products = await repo.findAll();
  return Response.json(products);
}
```

## ProductRepository

Manages product data with tenant isolation.

### Methods

| Method | Description |
|--------|-------------|
| `findAll(options?)` | Get all products with optional filters |
| `findById(id)` | Get product by ID |
| `findBySku(sku)` | Get product by SKU |
| `findByBarcode(barcode)` | Get product by barcode |
| `create(input)` | Create new product |
| `update(id, input, version)` | Update product with optimistic locking |
| `delete(id)` | Soft delete product |
| `categories()` | Get all unique categories |
| `count(options?)` | Count products with filters |

### Example

```typescript
const repo = new ProductRepository(tenantId, userId);

// Get all active products
const products = await repo.findAll();

// Get with filters
const filtered = await repo.findAll({
  category: 'Electronics',
  search: 'iPhone',
  locationId: 'loc-123'
});

// Create product
const product = await repo.create({
  sku: 'SKU-001',
  name: 'Product Name',
  unitCost: 10.00,
  sellingPrice: 20.00,
  category: 'Electronics'
});

// Update with version check
const updated = await repo.update(product.id, {
  name: 'New Name'
}, product.version);
```

## LocationRepository

Manages warehouse/store locations.

### Methods

| Method | Description |
|--------|-------------|
| `findAll(options?)` | Get all locations |
| `findById(id)` | Get location by ID |
| `findPrimary()` | Get primary location |
| `create(input)` | Create new location |
| `update(id, input)` | Update location |
| `delete(id)` | Soft delete location |
| `getProductCount(locationId)` | Get product count at location |
| `getTotalStockValue(locationId?)` | Get total stock value |

### Example

```typescript
const repo = new LocationRepository(tenantId, userId);

// Create primary warehouse
const warehouse = await repo.create({
  name: 'Main Warehouse',
  type: 'WAREHOUSE',
  address: '123 Main St',
  isPrimary: true
});

// Get statistics
const stats = await repo.getTotalStockValue('loc-123');
// Returns: { totalProducts: 150, totalValue: 15000.00 }
```

## StockRepository

Manages inventory levels across locations.

### Methods

| Method | Description |
|--------|-------------|
| `findAll(filters?)` | Get all stock levels |
| `findByProduct(productId)` | Get stock for product across all locations |
| `findByLocation(locationId)` | Get all stock at location |
| `find(productId, locationId)` | Get specific stock level |
| `getQuantity(productId, locationId)` | Get quantity |
| `getTotalQuantity(productId)` | Get total quantity across all locations |
| `upsert(productId, locationId, quantity)` | Update or insert stock level |
| `setQuantity(productId, locationId, quantity)` | Set exact quantity |
| `addQuantity(productId, locationId, quantity, version?)` | Add quantity |
| `deductStock(productId, locationId, quantity, expectedVersion)` | Deduct with locking |
| `adjustStock(productId, locationId, newQuantity, notes?)` | Adjust with event record |
| `transferStock(from, to, productId, quantity, notes?)` | Transfer stock |
| `getLowStockProducts(threshold?)` | Get products below reorder point |
| `getOutOfStockProducts()` | Get out of stock products |

### Example

```typescript
const repo = new StockRepository(tenantId, userId);

// Add stock on receipt
await repo.addQuantity('prod-123', 'loc-456', 100);

// Deduct on sale (with version check)
try {
  await repo.deductStock('prod-123', 'loc-456', 5, currentVersion);
} catch (error) {
  console.log('Insufficient stock or concurrent modification');
}

// Adjust stock (creates inventory event)
await repo.adjustStock('prod-123', 'loc-456', 95, 'Manual adjustment');

// Transfer between locations
await repo.transferStock('loc-456', 'loc-789', 'prod-123', 10);

// Get alerts
const lowStock = await repo.getLowStockProducts();
const outOfStock = await repo.getOutOfStockProducts();
```

## StockTransferRepository

Manages stock transfer workflows.

### Methods

| Method | Description |
|--------|-------------|
| `findAll(filters?)` | Get all transfers |
| `findById(id)` | Get transfer by ID |
| `create(input)` | Create new transfer |
| `update(id, input)` | Update transfer |
| `updateStatus(id, status)` | Update transfer status (executes transfer) |
| `cancel(id)` | Cancel transfer |
| `delete(id)` | Delete pending transfer |
| `getStats(filters?)` | Get transfer statistics |

### Example

```typescript
const repo = new StockTransferRepository(tenantId, userId);

// Create transfer
const transfer = await repo.create({
  fromLocationId: 'loc-456',
  toLocationId: 'loc-789',
  productId: 'prod-123',
  quantity: 10,
  notes: 'Restock store'
});

// Mark as in transit
await repo.updateStatus(transfer.id, 'IN_TRANSIT');

// Complete transfer (moves stock automatically)
await repo.updateStatus(transfer.id, 'COMPLETED');
```

## PurchaseOrderRepository

Manages purchase orders and receiving.

### Methods

| Method | Description |
|--------|-------------|
| `findAll(filters?)` | Get all POs |
| `findById(id)` | Get PO by ID |
| `findByOrderNumber(number)` | Get PO by number |
| `create(input, items)` | Create PO with items |
| `update(id, input)` | Update PO |
| `addItem(orderId, input)` | Add item to PO |
| `updateItem(itemId, input)` | Update PO item |
| `removeItem(itemId)` | Remove PO item |
| `receiveItem(itemId, quantity, locationId)` | Receive inventory from PO |
| `markAsOrdered(orderId)` | Mark PO as ordered |
| `markAsReceived(orderId)` | Mark PO as fully received |
| `cancel(orderId)` | Cancel PO |
| `delete(orderId)` | Delete draft PO |
| `getStats(filters?)` | Get PO statistics |

### Example

```typescript
const repo = new PurchaseOrderRepository(tenantId, userId);

// Create PO
const po = await repo.create(
  { orderNumber: 'PO-001', supplierName: 'Acme Corp' },
  [
    { productId: 'prod-123', quantity: 100, unitCost: 10.00 },
    { productId: 'prod-456', quantity: 50, unitCost: 15.00 }
  ]
);

// Mark as ordered
await repo.markAsOrdered(po.id);

// Receive partial quantity
await repo.receiveItem(po.items[0].id, 50, 'loc-456');

// Return to stock automatically
```

## InventoryEventRepository

Manages inventory event recording and querying.

### Methods

| Method | Description |
|--------|-------------|
| `findMany(options?)` | Get events with filters |
| `findByProduct(productId, options?)` | Get events for product |
| `findByLocation(locationId, options?)` | Get events for location |
| `findById(id)` | Get event by ID |
| `record(options)` | Record new event |
| `getByType(type, options?)` | Get events by type |
| `getRecent(limit)` | Get recent events |
| `getStats(options?)` | Get event statistics |
| `getProductHistory(productId, options?)` | Get product history |
| `getProductSummary(productId)` | Get product summary with stats |

### Example

```typescript
const repo = new InventoryEventRepository(tenantId, userId);

// Get recent events
const recent = await repo.getRecent(20);

// Get product history
const history = await repo.getProductHistory('prod-123');

// Get statistics
const stats = await repo.getStats({ dateFrom: new Date('2024-01-01') });
// Returns: { total: 100, netChange: 50, byType: [...] }

// Record custom event
await repo.record({
  type: 'ADJUSTMENT',
  productId: 'prod-123',
  locationId: 'loc-456',
  quantityDelta: -5,
  notes: 'Damaged goods removed',
  referenceType: 'manual',
  referenceId: 'adj-123'
});
```

## Event Types

All inventory events use these types:

- `STOCK_RECEIVED` - Stock received from PO
- `STOCK_SOLD` - Stock deducted for sale
- `ADJUSTMENT` - Manual adjustment
- `TRANSFER_IN` - Stock received via transfer
- `TRANSFER_OUT` - Stock sent via transfer
- `RESTOCK` - Stock added manually

## Error Handling

All repositories throw specific errors:

| Error | Description |
|-------|-------------|
| `PRODUCT_NOT_FOUND` | Product doesn't exist |
| `LOCATION_NOT_FOUND` | Location doesn't exist |
| `PRODUCT_CONFLICT` | Version mismatch |
| `STOCK_CONFLICT` | Insufficient stock or version mismatch |
| `TRANSFER_FAILED` | Transfer operation failed |
| `TRANSFER_COMPLETED` | Cannot delete completed transfer |
| `PO_NOT_FOUND` | Purchase order doesn't exist |
| `PO_NOT_DRAFT` | Cannot modify non-draft PO |
| `RECEIVING_EXCEEDS_ORDERED` | Receiving more than ordered |

## Best Practices

1. **Always use in API routes**: Create repo instances with `requireAuth()`
2. **Handle version conflicts**: Catch and retry on version conflicts
3. **Use transactions**: For multi-step operations
4. **Record events**: Let repository record events automatically
5. **Filter by tenant**: Don't manually add `where: { tenantId }` - repositories handle this

## API Route Template

```typescript
import { requireAuth } from '@/lib/auth';
import { [Repository] } from '@/lib/repositories';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { userId, tenantId } = await requireAuth(req);
    const repo = new [Repository](tenantId, userId);

    // Your code here
    const data = await repo.method(params);

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId, tenantId } = await requireAuth(req);
    const repo = new [Repository](tenantId, userId);
    const body = await req.json();

    const data = await repo.method(body);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    // Error handling
  }
}
```
