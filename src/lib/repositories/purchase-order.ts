import { BaseRepository } from './base';

export interface CreatePOInput {
  orderNumber: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  notes?: string;
}

export interface CreatePOItemInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface UpdatePOInput {
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  notes?: string;
  status?: 'DRAFT' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
  orderedBy?: string;
  orderedAt?: Date;
  receivedBy?: string;
  receivedAt?: Date;
}

export class PurchaseOrderRepository extends BaseRepository {
  async findAll(filters?: {
    status?: string;
    supplierId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    return this.executeWithPrisma(async (prisma) => {
      const where: any = { ...this.whereTenant };

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }

      return prisma.purchaseOrder.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async findById(id: string) {
    return this.executeWithPrisma(async (prisma) => {
      return prisma.purchaseOrder.findFirst({
        where: { id, ...this.whereTenant },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async findByOrderNumber(orderNumber: string) {
    return this.executeWithPrisma(async (prisma) => {
      return prisma.purchaseOrder.findFirst({
        where: { orderNumber, ...this.whereTenant },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async create(input: CreatePOInput, items: CreatePOItemInput[]) {
    return this.executeTransaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          ...this.whereTenant,
          ...input,
          orderedBy: this.userId,
        },
      });

      const createdItems = await Promise.all(
        items.map(item =>
          tx.purchaseOrderItem.create({
            data: {
              tenantId: this.tenantId,
              orderId: po.id,
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.quantity * item.unitCost,
            },
            include: {
              product: true,
            },
          })
        )
      );

      const totalAmount = createdItems.reduce((sum, item) => {
        return sum + item.totalCost.toNumber();
      }, 0);

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { totalAmount },
      });

      return this.findById(po.id);
    });
  }

  async update(id: string, input: UpdatePOInput) {
    return this.executeWithPrisma(async (prisma) => {
      const result = await prisma.purchaseOrder.updateMany({
        where: { id, ...this.whereTenant },
        data: input,
      });

      if (result.count === 0) {
        throw new Error('PO_NOT_FOUND');
      }

      return this.findById(id);
    });
  }

  async addItem(orderId: string, input: CreatePOItemInput) {
    return this.executeWithPrisma(async (prisma) => {
      const item = await prisma.purchaseOrderItem.create({
        data: {
          tenantId: this.tenantId,
          orderId,
          productId: input.productId,
          quantity: input.quantity,
          unitCost: input.unitCost,
          totalCost: input.quantity * input.unitCost,
        },
        include: {
          product: true,
        },
      });

      await this.recalculateTotal(orderId);

      return item;
    });
  }

  async updateItem(itemId: string, input: Partial<CreatePOItemInput>) {
    return this.executeWithPrisma(async (prisma) => {
      const item = await prisma.purchaseOrderItem.findFirst({
        where: { id: itemId, tenantId: this.tenantId },
      });

      if (!item) {
        throw new Error('PO_ITEM_NOT_FOUND');
      }

      const updated = await prisma.purchaseOrderItem.update({
        where: { id: itemId },
        data: {
          ...input,
          ...(input.quantity && input.unitCost && {
            totalCost: input.quantity * input.unitCost,
          }),
        },
        include: {
          product: true,
        },
      });

      await this.recalculateTotal(item.orderId);

      return updated;
    });
  }

  async removeItem(itemId: string) {
    return this.executeWithPrisma(async (prisma) => {
      const item = await prisma.purchaseOrderItem.findFirst({
        where: { id: itemId, tenantId: this.tenantId },
      });

      if (!item) {
        throw new Error('PO_ITEM_NOT_FOUND');
      }

      await prisma.purchaseOrderItem.delete({
        where: { id: itemId },
      });

      await this.recalculateTotal(item.orderId);

      return true;
    });
  }

  async receiveItem(
    itemId: string,
    quantity: number,
    locationId: string
  ) {
    return this.executeTransaction(async (tx) => {
      const item = await tx.purchaseOrderItem.findFirst({
        where: { id: itemId, tenantId: this.tenantId },
        include: { order: true },
      });

      if (!item) {
        throw new Error('PO_ITEM_NOT_FOUND');
      }

      if (item.receivedQty + quantity > item.quantity) {
        throw new Error('RECEIVING_EXCEEDS_ORDERED');
      }

      await tx.purchaseOrderItem.update({
        where: { id: itemId },
        data: {
          receivedQty: { increment: quantity },
        },
      });

      await tx.$executeRaw`
        INSERT INTO stock_levels (id, tenant_id, product_id, location_id, quantity, reserved_quantity, reorder_point, version, updated_at)
        VALUES (gen_random_uuid(), ${this.tenantId}, ${item.productId}, ${locationId}, ${quantity}, 0, 0, 0, NOW())
        ON CONFLICT (tenant_id, product_id, location_id)
        DO UPDATE SET
          quantity = stock_levels.quantity + ${quantity},
          version = stock_levels.version + 1,
          updated_at = NOW()
      `;

      await tx.inventoryEvent.create({
        data: {
          tenantId: this.tenantId,
          type: 'STOCK_RECEIVED',
          productId: item.productId,
          locationId,
          quantityDelta: quantity,
          userId: this.userId,
          referenceType: 'purchase_order',
          referenceId: item.orderId,
        },
      });

      await this.updatePOStatus(tx, item.orderId);

      return this.findById(item.orderId);
    });
  }

  async markAsOrdered(orderId: string) {
    return this.update(orderId, {
      status: 'ORDERED',
      orderedBy: this.userId,
      orderedAt: new Date(),
    });
  }

  async markAsReceived(orderId: string) {
    return this.update(orderId, {
      status: 'RECEIVED',
      receivedBy: this.userId,
      receivedAt: new Date(),
    });
  }

  async cancel(orderId: string) {
    return this.update(orderId, { status: 'CANCELLED' });
  }

  async delete(orderId: string) {
    return this.executeWithPrisma(async (prisma) => {
      const existing = await this.findById(orderId);
      if (!existing) {
        throw new Error('PO_NOT_FOUND');
      }

      if (existing.status !== 'DRAFT') {
        throw new Error('PO_NOT_DRAFT: Cannot delete non-draft PO');
      }

      const result = await prisma.purchaseOrder.deleteMany({
        where: { id: orderId, ...this.whereTenant },
      });

      if (result.count === 0) {
        throw new Error('PO_NOT_FOUND');
      }

      return true;
    });
  }

  private async recalculateTotal(orderId: string) {
    const prisma = this.prisma;
    const items = await prisma.purchaseOrderItem.findMany({
      where: { orderId, tenantId: this.tenantId },
    });

    const totalAmount = items.reduce((sum, item) => {
      return sum + item.totalCost.toNumber();
    }, 0);

    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { totalAmount },
    });
  }

  private async updatePOStatus(tx: any, orderId: string) {
    const order = await tx.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    const totalOrdered = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const totalReceived = order.items.reduce((sum: number, item: any) => sum + item.receivedQty, 0);

    if (totalReceived === 0) {
      return;
    }

    if (totalReceived === totalOrdered) {
      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: {
          status: 'RECEIVED',
          receivedBy: this.userId,
          receivedAt: new Date(),
        },
      });
    } else {
      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: { status: 'PARTIAL' },
      });
    }
  }

  async getStats(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    return this.executeWithPrisma(async (prisma) => {
      const where: any = { ...this.whereTenant };

      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }

      const [total, byStatus, totalAmount] = await Promise.all([
        prisma.purchaseOrder.count({ where }),
        prisma.purchaseOrder.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.purchaseOrder.aggregate({
          where,
          _sum: { totalAmount: true },
        }),
      ]);

      return {
        total,
        totalAmount: totalAmount._sum.totalAmount?.toNumber() || 0,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      };
    });
  }
}
