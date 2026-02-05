import { BaseRepository } from './base';

export class StockRepository extends BaseRepository {
  async findAll(filters?: {
    locationId?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    productId?: string;
  }) {
    return this.executeWithPrisma(async (prisma) => {
      const where: any = { ...this.whereTenant };

      if (filters?.locationId) {
        where.locationId = filters.locationId;
      }

      if (filters?.productId) {
        where.productId = filters.productId;
      }

      if (filters?.lowStock) {
        where.quantity = {
          lte: prisma.stockLevel.fields.reorderPoint,
        };
      }

      if (filters?.outOfStock) {
        where.quantity = {
          equals: 0,
        };
      }

      return prisma.stockLevel.findMany({
        where,
        include: {
          product: {
            include: {
              stockLevels: true,
            },
          },
          location: true,
        },
        orderBy: { product: { name: 'asc' } },
      });
    });
  }

  async findByProduct(productId: string) {
    return this.executeWithPrisma(async (prisma) => {
      return prisma.stockLevel.findMany({
        where: {
          ...this.whereTenant,
          productId,
          product: { isActive: true, deletedAt: null },
        },
        include: {
          location: true,
          product: true,
        },
      });
    });
  }

  async findByLocation(locationId: string) {
    return this.executeWithPrisma(async (prisma) => {
      return prisma.stockLevel.findMany({
        where: {
          tenantId: this.tenantId,
          locationId,
          product: { isActive: true, deletedAt: null },
        },
        include: {
          product: true,
          location: true,
        },
        orderBy: { product: { name: 'asc' } },
      });
    });
  }

  async find(productId: string, locationId: string) {
    return this.executeWithPrisma(async (prisma) => {
      return prisma.stockLevel.findUnique({
        where: {
          tenantId_productId_locationId: {
            tenantId: this.tenantId,
            productId,
            locationId,
          },
        },
        include: {
          product: true,
          location: true,
        },
      });
    });
  }

  async getQuantity(productId: string, locationId: string): Promise<number> {
    return this.executeWithPrisma(async (prisma) => {
      const stock = await this.find(productId, locationId);
      return stock?.quantity || 0;
    });
  }

  async getTotalQuantity(productId: string): Promise<number> {
    return this.executeWithPrisma(async (prisma) => {
      const result = await prisma.stockLevel.aggregate({
        where: {
          ...this.whereTenant,
          productId,
          product: { isActive: true, deletedAt: null },
        },
        _sum: {
          quantity: true,
        },
      });

      return result._sum.quantity || 0;
    });
  }

  async upsert(productId: string, locationId: string, quantity: number) {
    return this.executeWithPrisma(async (prisma) => {
      const result = await prisma.$executeRaw`
        INSERT INTO stock_levels (id, tenant_id, product_id, location_id, quantity, reserved_quantity, reorder_point, version, updated_at)
        VALUES (gen_random_uuid(), ${this.tenantId}, ${productId}, ${locationId}, ${quantity}, 0, 0, 0, NOW())
        ON CONFLICT (tenant_id, product_id, location_id)
        DO UPDATE SET
          quantity = stock_levels.quantity + ${quantity},
          version = stock_levels.version + 1,
          updated_at = NOW()
        RETURNING *
      `;

      return this.find(productId, locationId);
    });
  }

  async setQuantity(productId: string, locationId: string, quantity: number) {
    return this.executeWithPrisma(async (prisma) => {
      const result = await prisma.$executeRaw`
        INSERT INTO stock_levels (id, tenant_id, product_id, location_id, quantity, reserved_quantity, reorder_point, version, updated_at)
        VALUES (gen_random_uuid(), ${this.tenantId}, ${productId}, ${locationId}, ${quantity}, 0, 0, 0, NOW())
        ON CONFLICT (tenant_id, product_id, location_id)
        DO UPDATE SET
          quantity = ${quantity},
          version = stock_levels.version + 1,
          updated_at = NOW()
        RETURNING *
      `;

      return this.find(productId, locationId);
    });
  }

  async addQuantity(productId: string, locationId: string, quantity: number, expectedVersion?: number) {
    return this.executeWithPrisma(async (prisma) => {
      let result;

      if (expectedVersion !== undefined) {
        result = await prisma.$executeRaw`
          UPDATE stock_levels
          SET quantity = quantity + ${quantity},
              version = version + 1,
              updated_at = NOW()
          WHERE tenant_id = ${this.tenantId}
            AND product_id = ${productId}
            AND location_id = ${locationId}
            AND version = ${expectedVersion}
        `;
      } else {
        result = await prisma.$executeRaw`
          UPDATE stock_levels
          SET quantity = quantity + ${quantity},
              version = version + 1,
              updated_at = NOW()
          WHERE tenant_id = ${this.tenantId}
            AND product_id = ${productId}
            AND location_id = ${locationId}
        `;
      }

      if (result === 0 && expectedVersion !== undefined) {
        throw new Error('STOCK_CONFLICT: Version mismatch');
      }

      return this.find(productId, locationId);
    });
  }

  async deductStock(
    productId: string,
    locationId: string,
    quantity: number,
    expectedVersion: number
  ) {
    return this.executeTransaction(async (tx) => {
      const result = await tx.$executeRaw`
        UPDATE stock_levels
        SET quantity = quantity - ${quantity},
            version = version + 1,
            updated_at = NOW()
        WHERE tenant_id = ${this.tenantId}
          AND product_id = ${productId}
          AND location_id = ${locationId}
          AND version = ${expectedVersion}
          AND quantity >= ${quantity}
      `;

      if (result === 0) {
        throw new Error('STOCK_CONFLICT: Insufficient stock or concurrent modification');
      }

      await this.recordInventoryEvent(tx, {
        type: 'STOCK_SOLD',
        productId,
        locationId,
        quantityDelta: -quantity,
        notes: 'Deducted via sale/usage',
      });

      return true;
    });
  }

  async adjustStock(
    productId: string,
    locationId: string,
    newQuantity: number,
    notes?: string
  ) {
    return this.executeTransaction(async (tx) => {
      const current = await tx.stockLevel.findUnique({
        where: {
          tenantId_productId_locationId: {
            tenantId: this.tenantId,
            productId,
            locationId,
          },
        },
      });

      const quantityChange = newQuantity - (current?.quantity || 0);

      const result = await tx.$executeRaw`
        INSERT INTO stock_levels (id, tenant_id, product_id, location_id, quantity, reserved_quantity, reorder_point, version, updated_at)
        VALUES (gen_random_uuid(), ${this.tenantId}, ${productId}, ${locationId}, ${newQuantity}, 0, 0, 0, NOW())
        ON CONFLICT (tenant_id, product_id, location_id)
        DO UPDATE SET
          quantity = ${newQuantity},
          version = stock_levels.version + 1,
          updated_at = NOW()
        RETURNING *
      `;

      if (quantityChange !== 0) {
        await this.recordInventoryEvent(tx, {
          type: 'ADJUSTMENT',
          productId,
          locationId,
          quantityDelta: quantityChange,
          notes: notes || `Adjusted to ${newQuantity}`,
        });
      }

      return this.find(productId, locationId);
    });
  }

  async transferStock(
    fromLocationId: string,
    toLocationId: string,
    productId: string,
    quantity: number,
    notes?: string
  ) {
    return this.executeTransaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO stock_levels (id, tenant_id, product_id, location_id, quantity, reserved_quantity, reorder_point, version, updated_at)
        VALUES (gen_random_uuid(), ${this.tenantId}, ${productId}, ${toLocationId}, ${quantity}, 0, 0, 0, NOW())
        ON CONFLICT (tenant_id, product_id, location_id)
        DO UPDATE SET
          quantity = stock_levels.quantity + ${quantity},
          version = stock_levels.version + 1,
          updated_at = NOW()
      `;

      const sourceUpdate = await tx.$executeRaw`
        UPDATE stock_levels
        SET quantity = quantity - ${quantity},
            version = version + 1,
            updated_at = NOW()
        WHERE tenant_id = ${this.tenantId}
          AND location_id = ${fromLocationId}
          AND product_id = ${productId}
          AND quantity >= ${quantity}
      `;

      if (sourceUpdate === 0) {
        throw new Error('TRANSER_FAILED: Insufficient stock at source location');
      }

      await tx.stockTransfer.create({
        data: {
          tenantId: this.tenantId,
          fromLocationId,
          toLocationId,
          productId,
          quantity,
          status: 'COMPLETED',
          requestedBy: this.userId,
          notes,
        },
      });

      await this.recordInventoryEvent(tx, {
        type: 'TRANSFER_OUT',
        productId,
        locationId: fromLocationId,
        quantityDelta: -quantity,
        notes: notes || 'Stock transfer',
      });

      await this.recordInventoryEvent(tx, {
        type: 'TRANSFER_IN',
        productId,
        locationId: toLocationId,
        quantityDelta: quantity,
        notes: notes || 'Stock transfer',
      });

      return true;
    });
  }

  async recordInventoryEvent(
    tx: any,
    options: {
      type: string;
      productId: string;
      locationId?: string;
      quantityDelta: number;
      notes?: string;
      referenceType?: string;
      referenceId?: string;
    }
  ) {
    const total = await this.prisma.stockLevel.aggregate({
      where: {
        tenantId: this.tenantId,
        productId: options.productId,
        ...(options.locationId && { locationId: options.locationId }),
      },
      _sum: { quantity: true },
    });

    return tx.inventoryEvent.create({
      data: {
        tenantId: this.tenantId,
        type: options.type as any,
        productId: options.productId,
        locationId: options.locationId,
        quantityDelta: options.quantityDelta,
        runningBalance: total._sum.quantity || 0,
        userId: this.userId,
        notes: options.notes,
        referenceType: options.referenceType,
        referenceId: options.referenceId,
      },
    });
  }

  async getLowStockProducts(threshold?: number) {
    return this.executeWithPrisma(async (prisma) => {
      const where: any = {
        ...this.whereTenant,
        product: { isActive: true, deletedAt: null },
      };

      if (threshold !== undefined) {
        where.reorderPoint = threshold;
      } else {
        where.quantity = {
          lte: prisma.stockLevel.fields.reorderPoint,
        };
      }

      return prisma.stockLevel.findMany({
        where,
        include: {
          product: true,
          location: true,
        },
        orderBy: { quantity: 'asc' },
      });
    });
  }

  async getOutOfStockProducts() {
    return this.executeWithPrisma(async (prisma) => {
      return prisma.stockLevel.findMany({
        where: {
          ...this.whereTenant,
          quantity: 0,
          product: { isActive: true, deletedAt: null },
        },
        include: {
          product: true,
          location: true,
        },
        orderBy: { product: { name: 'asc' } },
      });
    });
  }
}
