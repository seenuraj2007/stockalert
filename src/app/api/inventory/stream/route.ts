import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !user.tenantId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tenantId = user.tenantId;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(`data: ${JSON.stringify({ type: 'connected', tenantId })}\n\n`);

        const initialEvents = await prisma.inventoryEvent.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 10,
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

        controller.enqueue(`data: ${JSON.stringify({ type: 'initial', events: initialEvents })}\n\n`);

        const pollInterval = setInterval(async () => {
          try {
            const events = await prisma.inventoryEvent.findMany({
              where: { tenantId },
              orderBy: { createdAt: 'desc' },
              take: 10,
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

            const lowStock = await prisma.stockLevel.findMany({
              where: {
                tenantId,
                product: { isActive: true, deletedAt: null },
                quantity: { lte: 0 },
              },
              take: 5,
              include: {
                product: true,
                location: true,
              },
            });

            const outOfStock = await prisma.stockLevel.findMany({
              where: {
                tenantId,
                product: { isActive: true, deletedAt: null },
                quantity: 0,
              },
              take: 5,
              include: {
                product: true,
                location: true,
              },
            });

            const transferStats = await prisma.stockTransfer.groupBy({
              by: ['status'],
              where: {
                tenantId,
                status: { in: ['PENDING', 'IN_TRANSIT'] },
              },
              _count: true,
            });

            const poStats = await prisma.purchaseOrder.groupBy({
              by: ['status'],
              where: {
                tenantId,
                status: { in: ['DRAFT', 'ORDERED', 'PARTIAL'] },
              },
              _count: true,
            });

            controller.enqueue(`data: ${JSON.stringify({
              type: 'update',
              events: events.slice(0, 5),
              lowStock: lowStock.length,
              outOfStock: outOfStock.length,
              transfers: transferStats,
              purchaseOrders: poStats,
              timestamp: new Date().toISOString(),
            })}\n\n`);

          } catch (error) {
            console.error('Error polling for updates:', error);
          }
        }, 5000);

        req.signal.addEventListener('abort', () => {
          clearInterval(pollInterval);
        });

      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export const dynamic = 'force-dynamic';
