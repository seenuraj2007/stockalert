import { BaseRepository } from './base';

export interface CreateTransferInput {
  fromLocationId: string;
  toLocationId: string;
  productId: string;
  quantity: number;
  notes?: string;
}

export interface UpdateTransferInput {
  status?: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  completedBy?: string;
}

export class StockTransferRepository extends BaseRepository {
  async findAll(filters?: {
    status?: string;
    locationId?: string;
    productId?: string;
  }) {
    return this.executeWithPrisma(async (prisma) => {
      const where: any = { ...this.whereTenant };

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.locationId) {
        where.OR = [
          { fromLocationId: filters.locationId },
          { toLocationId: filters.locationId },
        ];
      }

      if (filters?.productId) {
        where.productId = filters.productId;
      }

      return prisma.stockTransfer.findMany({
        where,
        include: {
          fromLocation: true,
          toLocation: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async findById(id: string) {
    return this.executeWithPrisma(async (prisma) => {
      return prisma.stockTransfer.findFirst({
        where: { id, ...this.whereTenant },
        include: {
          fromLocation: true,
          toLocation: true,
        },
      });
    });
  }

  async create(input: CreateTransferInput) {
    return this.executeWithPrisma(async (prisma) => {
      const transfer = await prisma.stockTransfer.create({
        data: {
          ...this.whereTenant,
          ...input,
          status: 'PENDING',
          requestedBy: this.userId,
        },
        include: {
          fromLocation: true,
          toLocation: true,
        },
      });

      return transfer;
    });
  }

  async update(id: string, input: UpdateTransferInput) {
    return this.executeWithPrisma(async (prisma) => {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('TRANSFER_NOT_FOUND');
      }

      let completedBy = input.completedBy;
      let completedAt: Date | undefined;

      if (input.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        completedBy = completedBy || this.userId;
        completedAt = new Date();
      }

      const result = await prisma.stockTransfer.updateMany({
        where: { id, ...this.whereTenant },
        data: {
          ...input,
          ...(completedAt && { completedAt }),
        },
      });

      if (result.count === 0) {
        throw new Error('TRANSFER_NOT_FOUND');
      }

      return this.findById(id);
    });
  }

  async updateStatus(id: string, status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED') {
    return this.executeTransaction(async (tx) => {
      const existing = await tx.stockTransfer.findFirst({
        where: { id, ...this.whereTenant },
      });

      if (!existing) {
        throw new Error('TRANSFER_NOT_FOUND');
      }

      if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        await tx.$executeRaw`
          INSERT INTO stock_levels (id, tenant_id, product_id, location_id, quantity, reserved_quantity, reorder_point, version, updated_at)
          VALUES (gen_random_uuid(), ${this.tenantId}, ${existing.productId}, ${existing.toLocationId}, ${existing.quantity}, 0, 0, 0, NOW())
          ON CONFLICT (tenant_id, product_id, location_id)
          DO UPDATE SET
            quantity = stock_levels.quantity + ${existing.quantity},
            version = stock_levels.version + 1,
            updated_at = NOW()
        `;

        await tx.$executeRaw`
          UPDATE stock_levels
          SET quantity = quantity - ${existing.quantity},
              version = version + 1,
              updated_at = NOW()
          WHERE tenant_id = ${this.tenantId}
            AND location_id = ${existing.fromLocationId}
            AND product_id = ${existing.productId}
            AND quantity >= ${existing.quantity}
        `;

        await tx.inventoryEvent.createMany({
          data: [
            {
              tenantId: this.tenantId,
              type: 'TRANSFER_OUT',
              productId: existing.productId,
              locationId: existing.fromLocationId,
              quantityDelta: -existing.quantity,
              userId: this.userId,
              referenceType: 'stock_transfer',
              referenceId: existing.id,
            },
            {
              tenantId: this.tenantId,
              type: 'TRANSFER_IN',
              productId: existing.productId,
              locationId: existing.toLocationId,
              quantityDelta: existing.quantity,
              userId: this.userId,
              referenceType: 'stock_transfer',
              referenceId: existing.id,
            },
          ],
        });
      }

      const result = await tx.stockTransfer.updateMany({
        where: { id, ...this.whereTenant },
        data: {
          status,
          completedAt: status === 'COMPLETED' ? new Date() : null,
          completedBy: status === 'COMPLETED' ? this.userId : null,
        },
      });

      return this.findById(id);
    });
  }

  async cancel(id: string) {
    return this.update(id, { status: 'CANCELLED' });
  }

  async delete(id: string) {
    return this.executeWithPrisma(async (prisma) => {
      const result = await prisma.stockTransfer.deleteMany({
        where: { id, ...this.whereTenant, status: 'PENDING' },
      });

      if (result.count === 0) {
        const existing = await this.findById(id);
        if (existing) {
          throw new Error('TRANSFER_COMPLETED: Cannot delete completed transfer');
        }
        throw new Error('TRANSFER_NOT_FOUND');
      }

      return true;
    });
  }

  async getStats(filters?: {
    locationId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    return this.executeWithPrisma(async (prisma) => {
      const where: any = { ...this.whereTenant };

      if (filters?.locationId) {
        where.OR = [
          { fromLocationId: filters.locationId },
          { toLocationId: filters.locationId },
        ];
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

      const [total, byStatus] = await Promise.all([
        prisma.stockTransfer.count({ where }),
        prisma.stockTransfer.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
      ]);

      return {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      };
    });
  }
}
