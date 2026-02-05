import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const exportFormat = searchParams.get('format') || 'json'
    const table = searchParams.get('table')
    const scope = searchParams.get('scope') || 'all'

    if (!['json', 'csv'].includes(exportFormat)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `stockalert-export-${timestamp}`

    const tenantId = user.tenantId

    if (scope === 'all' && !table) {
      const exportData: Record<string, any[]> = {}

      const tables = [
        'products',
        'locations',
        'suppliers',
        'purchase_orders',
        'stock_transfers',
        'alerts',
        'stock_history'
      ]

      for (const t of tables) {
        try {
          let data: any[] = []

          switch (t) {
            case 'products':
              data = await prisma.product.findMany({ where: { tenantId } })
              break
            case 'locations':
              data = await prisma.location.findMany({ where: { tenantId } })
              break
            case 'suppliers':
              data = await prisma.product.findMany({
                where: { tenantId },
                select: { id: true, supplierName: true, supplierEmail: true, supplierPhone: true }
              })
              break
            case 'purchase_orders':
              data = await prisma.purchaseOrder.findMany({ where: { tenantId: user.tenantId } })
              break
            case 'stock_transfers':
              data = await prisma.stockTransfer.findMany({ where: { tenantId: user.tenantId } })
              break
            case 'alerts':
              data = await prisma.alert.findMany({ where: { tenantId: user.tenantId } })
              break
            case 'stock_history':
              data = await prisma.inventoryEvent.findMany({ where: { tenantId: user.tenantId } })
              break
          }

          exportData[t] = data
        } catch (err) {
          console.error(`Error exporting ${t}:`, err)
        }
      }

      exportData.user_profile = [{
        id: user.id,
        email: user.email
      }]

      const json = JSON.stringify(exportData, null, 2)

      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      })
    }

    const validTables = ['products', 'locations', 'suppliers', 'customers', 
                        'purchase_orders', 'stock_transfers', 'stock_history', 'alerts']
    const exportTable = table || 'products'
    if (!validTables.includes(exportTable)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    let data: any[] = []

    switch (exportTable) {
      case 'products':
        data = await prisma.product.findMany({ where: { tenantId: user.tenantId } })
        break
      case 'locations':
        data = await prisma.location.findMany({ where: { tenantId: user.tenantId } })
        break
      case 'suppliers':
        data = await prisma.product.findMany({
          where: { tenantId: user.tenantId },
          select: { id: true, supplierName: true, supplierEmail: true, supplierPhone: true }
        })
        break
      case 'customers':
        data = await prisma.member.findMany({ where: { tenantId: user.tenantId } })
        break
      case 'purchase_orders':
        data = await prisma.purchaseOrder.findMany({ where: { tenantId: user.tenantId } })
        break
      case 'stock_transfers':
        data = await prisma.stockTransfer.findMany({ where: { tenantId: user.tenantId } })
        break
      case 'stock_history':
        data = await prisma.inventoryEvent.findMany({ where: { tenantId: user.tenantId } })
        break
      case 'alerts':
        data = await prisma.alert.findMany({ where: { tenantId: user.tenantId } })
        break
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 404 })
    }

    if (exportFormat === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}-${exportTable}.json"`,
        },
      })
    }

    const headers = Object.keys(data[0] as Record<string, unknown>)
    const csv = convertToCSV(data, headers)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}-${exportTable}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function convertToCSV(data: Array<Record<string, unknown>>, headers: string[]): string {
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) {
      return ''
    }
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const headerRow = headers.map(escapeCSV).join(',')
  const dataRows = data.map(row =>
    headers.map(header => escapeCSV(row[header])).join(',')
  )

  return [headerRow, ...dataRows].join('\n')
}
