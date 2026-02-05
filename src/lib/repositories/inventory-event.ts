import { BaseRepository } from './base';

export interface FindEventsOptions {
  productId?: string;
  locationId?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

export class InventoryEventRepository extends BaseRepository {
  async findMany(options?: FindEventsOptions) {
    return this.executeWithPrisma(async (prisma) => {
      const where: any = { ...this.whereTenant };

      if (options?.productId) {
        where.productId = options.productId;
      }

      if (options?.locationId) {
        where.locationId = options.locationId;
      }

      if (options?.type) {
        where.type = options.type;
      }

      if (options?.dateFrom || options?.dateTo) {
        where.createdAt = {};
        if (options.dateFrom) {
          where.createdAt.gte = options.dateFrom;
        }
        if (options.dateTo) {
          where.createdAt.lte = options.dateTo;
        }
      }

      return prisma.inventoryEvent.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
      });
    });
  }

  async findByProduct(productId: string, options?: { limit?: number }) {
    return this.findMany({
      productId,
      limit: options?.limit || 50,
    });
  }

  async findByLocation(locationId: string, options?: { limit?: number }) {
    return this.findMany({
      locationId,
      limit: options?.limit || 50,
    });
  }

  async findById(id: string) {
    return this.executeWithPrisma(async (prisma) => {
      return prisma.inventoryEvent.findFirst({
        where: { id, ...this.whereTenant },
        include: {
          product: true,
        },
      });
    });
  }

  async record(options: {
    type: string;
    productId: string;
    locationId?: string;
    quantityDelta: number;
    notes?: string;
    referenceType?: string;
    referenceId?: string;
    metadata?: any;
  }) {
    return this.executeWithPrisma(async (prisma) => {
      const total = await prisma.stockLevel.aggregate({
        where: {
          tenantId: this.tenantId,
          productId: options.productId,
          ...(options.locationId && { locationId: options.locationId }),
        },
        _sum: { quantity: true },
      });

      return prisma.inventoryEvent.create({
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
          metadata: options.metadata,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      });
    });
  }

  async getByType(type: string, options?: { limit?: number, dateFrom?: Date, dateTo?: Date }) {
    return this.findMany({
      type,
      limit: options?.limit || 50,
      dateFrom: options?.dateFrom,
      dateTo: options?.dateTo,
    });
  }

  async getRecent(limit: number = 20) {
    return this.executeWithPrisma(async (prisma) => {
      return prisma.inventoryEvent.findMany({
        where: { ...this.whereTenant },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    });
  }

  async getStats(options?: { dateFrom?: Date, dateTo?: Date }) {
    return this.executeWithPrisma(async (prisma) => {
      const where: any = { ...this.whereTenant };

      if (options?.dateFrom || options?.dateTo) {
        where.createdAt = {};
        if (options.dateFrom) {
          where.createdAt.gte = options.dateFrom;
        }
        if (options.dateTo) {
          where.createdAt.lte = options.dateTo;
        }
      }

      const [total, byType, netChange] = await Promise.all([
        prisma.inventoryEvent.count({ where }),
        prisma.inventoryEvent.groupBy({
          by: ['type'],
          where,
          _count: true,
          _sum: { quantityDelta: true },
        }),
        prisma.inventoryEvent.aggregate({
          where,
          _sum: { quantityDelta: true },
        }),
      ]);

      return {
        total,
        netChange: netChange._sum.quantityDelta || 0,
        byType: byType.map(item => ({
          type: item.type,
          count: item._count,
          netChange: item._sum.quantityDelta || 0,
        })),
      };
    });
  }

  async getProductHistory(
    productId: string,
    options?: { limit?: number, dateFrom?: Date, dateTo?: Date }
  ) {
    return this.findMany({
      productId,
      limit: options?.limit || 50,
      dateFrom: options?.dateFrom,
      dateTo: options?.dateTo,
    });
  }

  async getProductSummary(productId: string) {
    return this.executeWithPrisma(async (prisma) => {
      const [events, stats] = await Promise.all([
        prisma.inventoryEvent.findMany({
          where: {
            ...this.whereTenant,
            productId,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.inventoryEvent.groupBy({
          by: ['type'],
          where: {
            ...this.whereTenant,
            productId,
          },
          _count: true,
          _sum: { quantityDelta: true },
        }),
      ]);

      return {
        recentEvents: events,
        stats: {
          byType: stats.map(item => ({
            type: item.type,
            count: item._count,
            netChange: item._sum.quantityDelta || 0,
          })),
        },
      };
    });
  }

  async delete(id: string) {
    return this.executeWithPrisma(async (prisma) => {
      const result = await prisma.inventoryEvent.deleteMany({
        where: { id, ...this.whereTenant },
      });

      if (result.count === 0) {
        throw new Error('EVENT_NOT_FOUND');
      }

      return true;
    });
  }
}
