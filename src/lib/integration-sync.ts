// Integration Sync Service
// This file needs to be fully migrated to use Prisma instead of Supabase
// For now, it provides placeholder functionality to allow the build to pass

export type IntegrationPlatform = 'shopify' | 'woocommerce'

export interface Integration {
  id: string
  user_id: string
  platform: IntegrationPlatform
  store_name: string
  store_url: string
  api_key?: string
  api_secret?: string
  access_token: string
  scope?: string
  is_active: boolean
  sync_products: boolean
  sync_orders: boolean
  sync_inventory: boolean
  last_sync_at?: string
  last_sync_status?: string
  last_sync_error?: string
}

export interface SyncResult {
  success: boolean
  items_processed: number
  items_created: number
  items_updated: number
  items_failed: number
  errors: string[]
}

export class IntegrationSyncService {
  async getIntegration(_userId: string, _platform: IntegrationPlatform): Promise<Integration | null> {
    // TODO: Implement with Prisma
    return null
  }

  async getAllIntegrations(_userId: string): Promise<Integration[]> {
    // TODO: Implement with Prisma
    return []
  }

  async saveIntegration(_integration: Partial<Integration>): Promise<Integration> {
    // TODO: Implement with Prisma
    throw new Error('Integration sync not yet implemented - needs Prisma migration')
  }

  async deleteIntegration(_integrationId: string): Promise<void> {
    // TODO: Implement with Prisma
  }

  async logSync(
    _integrationId: string,
    _syncType: 'products' | 'orders' | 'inventory',
    _result: SyncResult
  ): Promise<void> {
    // TODO: Implement with Prisma
  }

  async syncProducts(_integration: Integration): Promise<SyncResult> {
    return {
      success: false,
      items_processed: 0,
      items_created: 0,
      items_updated: 0,
      items_failed: 0,
      errors: ['Product sync not yet implemented - needs Prisma migration']
    }
  }

  async syncInventory(_integration: Integration, _localProductId: string, _quantity: number): Promise<void> {
    // TODO: Implement with Prisma
  }

  async syncOrders(_integration: Integration): Promise<SyncResult> {
    return {
      success: false,
      items_processed: 0,
      items_created: 0,
      items_updated: 0,
      items_failed: 0,
      errors: ['Order sync not yet implemented - needs Prisma migration']
    }
  }
}

export const syncService = new IntegrationSyncService()

// Re-export Shopify and WooCommerce clients for backward compatibility
export { ShopifyClient } from './shopify'
export { mapShopifyProductToLocal, mapLocalProductToShopify } from './shopify'
export { WooCommerceClient } from './woocommerce'
export { mapWooCommerceProductToLocal, mapLocalProductToWooCommerce } from './woocommerce'
