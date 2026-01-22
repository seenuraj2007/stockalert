'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  Store,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  RefreshCcw,
  ArrowLeft,
  Link2
} from 'lucide-react'
import SidebarLayout from '@/components/SidebarLayout'
import { SubscriptionGate } from '@/components/SubscriptionGate'

interface Integration {
  id: string
  platform: 'shopify' | 'woocommerce'
  store_name: string
  store_url: string
  is_active: boolean
  sync_products: boolean
  sync_orders: boolean
  sync_inventory: boolean
  last_sync_at: string | null
  last_sync_status: string | null
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<'shopify' | 'woocommerce'>('shopify')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations')
      const data = await res.json()
      if (data.integrations) {
        setIntegrations(data.integrations)
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (integrationId: string, syncType: 'products' | 'orders') => {
    setSyncing(integrationId)
    try {
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration_id: integrationId, sync_type: syncType }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Synced ${data.result.items_processed} items successfully!` })
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Sync failed' })
    } finally {
      setSyncing(null)
      fetchIntegrations()
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return

    try {
      const res = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Integration disconnected successfully' })
        fetchIntegrations()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect integration' })
    }
  }

  const connectShopify = () => {
    const shop = prompt('Enter your Shopify store name (e.g., mystore):')
    if (shop) {
      window.location.href = `/api/integrations/shopify/connect?shop=${shop}`
    }
  }

  const connectWooCommerce = async () => {
    const storeUrl = prompt('Enter your WooCommerce store URL:')
    const consumerKey = prompt('Enter your WooCommerce Consumer Key:')
    const consumerSecret = prompt('Enter your WooCommerce Consumer Secret:')

    if (storeUrl && consumerKey && consumerSecret) {
      try {
        const res = await fetch('/api/integrations/woocommerce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store_url: storeUrl, consumer_key: consumerKey, consumer_secret: consumerSecret }),
        })
        const data = await res.json()
        if (data.success) {
          setMessage({ type: 'success', text: 'WooCommerce connected successfully!' })
          fetchIntegrations()
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to connect' })
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to connect' })
      }
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'shopify':
        return <ShoppingCart className="w-5 h-5" />
      case 'woocommerce':
        return <Store className="w-5 h-5" />
      default:
        return <Package className="w-5 h-5" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'shopify':
        return 'from-green-500 to-green-600'
      case 'woocommerce':
        return 'from-purple-500 to-purple-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Link2 className="w-8 h-8 text-indigo-300" />
              </div>
            </div>
            <p className="text-gray-600 font-medium">Loading integrations...</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <SubscriptionGate>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-4">
          {message && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
              <div className={`p-4 rounded-2xl flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50/80 backdrop-blur-sm border border-green-200 text-green-700' 
                  : 'bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Integrations</span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Integration
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            {integrations.length === 0 ? (
              <div className="max-w-2xl mx-auto text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-indigo-200">
                  <Link2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">No Integrations Connected</h2>
                <p className="text-gray-600 mb-8 text-lg">
                  Connect your e-commerce stores to sync products, orders, and inventory automatically.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Integration
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {integrations.map((integration) => (
                  <div key={integration.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${getPlatformColor(integration.platform)}`}>
                          <div className="text-white">
                            {getPlatformIcon(integration.platform)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">{integration.store_name}</h3>
                            {integration.is_active ? (
                              <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-green-50 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1 border border-green-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full border border-gray-200">
                                Inactive
                              </span>
                            )}
                          </div>
                          <a
                            href={integration.store_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 mt-2 transition-colors"
                          >
                            {integration.store_url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Disconnect"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`p-2 rounded-lg ${integration.sync_products ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Package className={`w-4 h-4 ${integration.sync_products ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <span className={integration.sync_products ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                          Products {integration.sync_products ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`p-2 rounded-lg ${integration.sync_orders ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <ShoppingCart className={`w-4 h-4 ${integration.sync_orders ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <span className={integration.sync_orders ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                          Orders {integration.sync_orders ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`p-2 rounded-lg ${integration.sync_inventory ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <RefreshCw className={`w-4 h-4 ${integration.sync_inventory ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <span className={integration.sync_inventory ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                          Inventory {integration.sync_inventory ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>

                    {integration.last_sync_at && (
                      <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Last synced: {new Date(integration.last_sync_at).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleSync(integration.id, 'products')}
                            disabled={syncing === integration.id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all cursor-pointer text-sm font-medium"
                          >
                            {syncing === integration.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCcw className="w-4 h-4" />
                            )}
                            Sync Products
                          </button>
                          <button
                            onClick={() => handleSync(integration.id, 'orders')}
                            disabled={syncing === integration.id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all cursor-pointer text-sm font-medium"
                          >
                            {syncing === integration.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCcw className="w-4 h-4" />
                            )}
                            Sync Orders
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showAddModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Add Integration</h2>
                    <button 
                      onClick={() => setShowAddModal(false)} 
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        setSelectedPlatform('shopify')
                        connectShopify()
                      }}
                      className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                        <ShoppingCart className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Shopify</h3>
                        <p className="text-sm text-gray-500">Connect your Shopify store</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPlatform('woocommerce')
                        connectWooCommerce()
                      }}
                      className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                        <Store className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">WooCommerce</h3>
                        <p className="text-sm text-gray-500">Connect your WooCommerce store</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SubscriptionGate>
    </SidebarLayout>
  )
}
