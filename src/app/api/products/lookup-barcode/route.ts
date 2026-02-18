import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface OpenFoodFactsProduct {
  product_name?: string
  brands?: string
  categories?: string
  image_url?: string
  image_front_url?: string
  quantity?: string
  packaging?: string
  labels?: string
  origins?: string
  manufacturing_places?: string
}

interface OpenFoodFactsResponse {
  code: string
  product?: OpenFoodFactsProduct
  status: number
  status_verbose: string
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { barcode } = body

    if (!barcode || barcode.length < 8) {
      return NextResponse.json({ 
        error: 'Invalid barcode',
        found: false 
      }, { status: 400 })
    }

    let productData: any = {
      barcode,
      found: false,
      source: null
    }

    // 1. First check local database (products already entered by this tenant)
    const existingProduct = await prisma.product.findFirst({
      where: {
        tenantId: user.tenantId,
        barcode: barcode
      }
    })

    if (existingProduct) {
      return NextResponse.json({
        barcode,
        found: true,
        source: 'local',
        product: {
          name: existingProduct.name,
          category: existingProduct.category || '',
          unit: existingProduct.unit,
          sellingPrice: existingProduct.sellingPrice ? Number(existingProduct.sellingPrice) : null,
          unitCost: existingProduct.unitCost ? Number(existingProduct.unitCost) : null,
          imageUrl: existingProduct.imageUrl,
          hsnCode: existingProduct.hsnCode,
          gstRate: existingProduct.gstRate ? Number(existingProduct.gstRate) : 0,
          isPerishable: existingProduct.isPerishable,
          weightPerUnit: existingProduct.weightPerUnit ? Number(existingProduct.weightPerUnit) : null,
          minWeight: existingProduct.minWeight ? Number(existingProduct.minWeight) : null
        },
        message: 'Product already exists in your inventory'
      })
    }

    // 2. Try Open Food Facts API (free, for food/grocery items)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)

      if (response.ok) {
        const data: OpenFoodFactsResponse = await response.json()
        
        if (data.status === 1 && data.product) {
          const product = data.product
          
          // Parse quantity to extract weight/volume if available
          let weightPerUnit = 1
          let unit = 'unit'
          
          if (product.quantity) {
            // Try to extract weight (e.g., "500g", "1L", "750ml")
            const weightMatch = product.quantity.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l)/i)
            if (weightMatch) {
              const value = parseFloat(weightMatch[1])
              const unit = weightMatch[2].toLowerCase()
              
              if (unit === 'g') {
                weightPerUnit = value / 1000 // Convert to kg
              } else if (unit === 'kg') {
                weightPerUnit = value
              } else if (unit === 'ml') {
                weightPerUnit = value / 1000 // Convert to liters
              } else if (unit === 'l') {
                weightPerUnit = value
              }
            }
          }

          // Determine if it's a beverage/liquid
          const isLiquid = product.categories?.toLowerCase().includes('beverage') ||
                          product.categories?.toLowerCase().includes('drink') ||
                          product.quantity?.toLowerCase().includes('ml') ||
                          product.quantity?.toLowerCase().includes('l')

          productData = {
            barcode,
            found: true,
            source: 'openfoodfacts',
            product: {
              name: product.product_name || '',
              category: product.categories?.split(',')[0]?.trim() || 'Groceries',
              brand: product.brands?.split(',')[0]?.trim() || '',
              unit: isLiquid ? 'liter' : 'kg',
              weightPerUnit: weightPerUnit,
              minWeight: isLiquid ? 0.1 : 0.05, // Minimum sale quantity
              imageUrl: product.image_url || product.image_front_url || '',
              isPerishable: product.labels?.toLowerCase().includes('fresh') || 
                           product.labels?.toLowerCase().includes('refrigerated') ||
                           product.categories?.toLowerCase().includes('dairy') ||
                           product.categories?.toLowerCase().includes('meat') ||
                           false,
              // Default GST rates for India
              gstRate: 18, // Default 18% for most items
              hsnCode: '',
              sellingPrice: null, // User needs to set price
              unitCost: null
            }
          }

          return NextResponse.json(productData)
        }
      }
    } catch (error) {
      console.log('Open Food Facts lookup failed:', error)
      // Continue to return "not found"
    }

    // 3. Not found anywhere
    return NextResponse.json({
      barcode,
      found: false,
      source: null,
      message: 'Product not found. Please enter details manually.'
    })

  } catch (error) {
    console.error('Barcode lookup error:', error)
    return NextResponse.json({ 
      error: 'Failed to lookup barcode',
      found: false 
    }, { status: 500 })
  }
}
