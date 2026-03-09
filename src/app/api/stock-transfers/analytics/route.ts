import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

// GET - Get analytics for stock transfers
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30' // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get transfer statistics by status
    const statusCounts = await prisma.stockTransfer.groupBy({
      by: ['status'],
      where: { 
        tenantId: user.tenantId,
        createdAt: { gte: startDate }
      },
      _count: { id: true }
    })

    // Get transfer counts by day using raw query
    const dailyTransfers = await prisma.$queryRaw`
      SELECT DATE(t.created_at) as date, COUNT(*) as count
      FROM stock_transfers t
      WHERE t.tenant_id = ${user.tenantId}
        AND t.created_at >= ${startDate}
      GROUP BY DATE(t.created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    // Get top source locations
    const topSources = await prisma.stockTransfer.groupBy({
      by: ['fromLocationId'],
      where: { 
        tenantId: user.tenantId,
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    })

    // Get source location names
    const sourceLocationIds = topSources.map(s => s.fromLocationId)
    const sourceLocations = await prisma.location.findMany({
      where: { id: { in: sourceLocationIds } },
      select: { id: true, name: true }
    })
    const sourceLocationMap = new Map(sourceLocations.map(l => [l.id, l.name]))

    // Get top destination locations
    const topDestinations = await prisma.stockTransfer.groupBy({
      by: ['toLocationId'],
      where: { 
        tenantId: user.tenantId,
        createdAt: { gte: startDate }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    })

    // Get destination location names
    const destLocationIds = topDestinations.map(d => d.toLocationId)
    const destLocations = await prisma.location.findMany({
      where: { id: { in: destLocationIds } },
      select: { id: true, name: true }
    })
    const destLocationMap = new Map(destLocations.map(l => [l.id, l.name]))

    // Get average transfer time (for completed transfers)
    const completedTransfers = await prisma.stockTransfer.findMany({
      where: {
        tenantId: user.tenantId,
        status: 'COMPLETED',
        completedAt: { not: null }
      },
      select: {
        createdAt: true,
        completedAt: true
      },
      take: 100,
      orderBy: { completedAt: 'desc' }
    })

    let avgTransferTime = 0
    if (completedTransfers.length > 0) {
      const totalTime = completedTransfers.reduce((sum, t) => {
        const diff = (t.completedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24) // hours
        return sum + diff
      }, 0)
      avgTransferTime = totalTime / completedTransfers.length
    }

    // Get bottleneck analysis (transfers stuck in status for too long)
    const pendingTransfers = await prisma.stockTransfer.findMany({
      where: {
        tenantId: user.tenantId,
        status: { in: ['PENDING', 'IN_TRANSIT'] },
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // > 1 day old
      },
      include: {
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } }
      },
      orderBy: { createdAt: 'asc' },
      take: 10
    })

    // Get efficiency metrics
    const totalTransfers = await prisma.stockTransfer.count({
      where: { tenantId: user.tenantId }
    })
    const completedCount = statusCounts.find(s => s.status === 'COMPLETED')?._count.id || 0
    const pendingCount = statusCounts.find(s => s.status === 'PENDING')?._count.id || 0
    const inTransitCount = statusCounts.find(s => s.status === 'IN_TRANSIT')?._count.id || 0
    const cancelledCount = statusCounts.find(s => s.status === 'CANCELLED')?._count.id || 0

    const completionRate = totalTransfers > 0 ? (completedCount / totalTransfers) * 100 : 0

    return NextResponse.json({
      summary: {
        totalTransfers,
        completedCount,
        pendingCount,
        inTransitCount,
        cancelledCount,
        completionRate: Math.round(completionRate * 10) / 10,
        averageTransferTimeHours: Math.round(avgTransferTime * 10) / 10
      },
      byStatus: statusCounts.map(s => ({
        status: s.status.toLowerCase(),
        count: s._count.id
      })),
      dailyTransfers: (dailyTransfers as any[]).map(d => ({
        date: d.date,
        count: Number(d.count)
      })),
      topSources: topSources.map(s => ({
        locationId: s.fromLocationId,
        locationName: sourceLocationMap.get(s.fromLocationId) || 'Unknown',
        transferCount: s._count.id
      })),
      topDestinations: topDestinations.map(d => ({
        locationId: d.toLocationId,
        locationName: destLocationMap.get(d.toLocationId) || 'Unknown',
        transferCount: d._count.id
      })),
      bottlenecks: pendingTransfers.map(t => ({
        id: t.id,
        fromLocation: t.fromLocation?.name,
        toLocation: t.toLocation?.name,
        status: t.status.toLowerCase(),
        createdAt: t.createdAt,
        daysPending: Math.floor((Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      }))
    })
  } catch (error) {
    console.error('Get transfer analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
