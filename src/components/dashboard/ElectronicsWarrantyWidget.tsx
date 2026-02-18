'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Smartphone, Shield, AlertCircle, Wrench, CheckCircle, Clock } from 'lucide-react'

interface WarrantyItem {
  id: string
  serialNumber: string
  product: {
    id: string
    name: string
    sku: string
  }
  warrantyExpiry: string
  daysLeft: number
  status: string
  isExpiringSoon: boolean
}

export default function ElectronicsWarrantyWidget() {
  const [items, setItems] = useState<WarrantyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    expired: 0,
    expiringSoon: 0
  })

  useEffect(() => {
    fetchWarranties()
  }, [])

  const fetchWarranties = async () => {
    try {
      const res = await fetch('/api/warranty?status=expiring-soon&days=30')
      if (res.ok) {
        const data = await res.json()
        setItems(data.warranties.slice(0, 5))
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching warranties:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0 && stats.total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Warranty Status</h3>
            <p className="text-sm text-gray-500">Electronics & Mobile</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-700 font-medium">All warranties are up to date</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white sm:rounded-2xl sm:border sm:border-gray-100 overflow-hidden">
      {/* Mobile App Header */}
      <div className="sm:hidden sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Warranty Status</h3>
              <p className="text-xs text-gray-500">Electronics</p>
            </div>
          </div>
          <Link 
            href="/warranty"
            className="p-2 bg-gray-100 rounded-full"
          >
            <Shield className="w-5 h-5 text-gray-600" />
          </Link>
        </div>

        {/* Mobile Stats Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {stats.expiringSoon > 0 && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-orange-500 rounded-full shadow-sm">
              <AlertCircle className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">{stats.expiringSoon} Expiring</span>
            </div>
          )}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-blue-500 rounded-full shadow-sm">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">{stats.valid} Active</span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-green-500 rounded-full shadow-sm">
            <CheckCircle className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">{stats.total} Total</span>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:block p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Warranty Alerts</h3>
              <p className="text-sm text-gray-500">Electronics</p>
            </div>
          </div>
          <Link 
            href="/warranty"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Manage
          </Link>
        </div>

        <div className="flex gap-4 mt-4">
          {stats.expiringSoon > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-700">{stats.expiringSoon} Expiring</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-blue-700">{stats.valid} Active</span>
          </div>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="sm:hidden space-y-3 p-4">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-all ${
              item.isExpiringSoon ? 'border-l-4 border-l-orange-500' : ''
            } ${item.daysLeft <= 0 ? 'border-l-4 border-l-red-500' : ''}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">{item.product.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.product.sku}</p>
              </div>
              <div className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full ${
                item.daysLeft > 0 
                  ? item.isExpiringSoon ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {item.daysLeft > 0 ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span className="text-xs font-bold">
                  {item.daysLeft > 0 ? `${item.daysLeft}d` : 'Expired'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400 mb-0.5">Serial/IMEI</p>
                <p className="text-sm font-mono text-gray-700 truncate">{item.serialNumber}</p>
              </div>
              <div className={`px-3 py-2 rounded-lg ${
                item.daysLeft > 0 ? 'bg-blue-50' : 'bg-red-50'
              }`}>
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <p className={`text-sm font-semibold ${
                  item.daysLeft > 0 ? 'text-blue-700' : 'text-red-700'
                }`}>
                  {item.daysLeft > 0 ? 'Active' : 'Expired'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop List */}
      <div className="hidden sm:block divide-y divide-gray-100">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`p-4 hover:bg-gray-50 transition-colors ${
              item.isExpiringSoon ? 'bg-orange-50/50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.product.name}</p>
                <p className="text-sm text-gray-500 font-mono mt-1">{item.serialNumber}</p>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  item.daysLeft > 0 
                    ? item.isExpiringSoon ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {item.daysLeft > 0 ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="font-semibold">
                    {item.daysLeft > 0 ? `${item.daysLeft} days` : 'Expired'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Footer */}
      <div className="sm:hidden p-4 bg-gray-50 border-t border-gray-100">
        <Link 
          href="/serials/new"
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
        >
          <Smartphone className="w-5 h-5" />
          Add Serial/IMEI
        </Link>
      </div>

      {/* Desktop Footer */}
      <div className="hidden sm:flex p-4 bg-gray-50 border-t border-gray-100 items-center justify-between text-sm">
        <span className="text-gray-600">
          Total tracked: <span className="font-semibold text-gray-900">{stats.total} items</span>
        </span>
        <Link 
          href="/serials/new"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          + Add Serial
        </Link>
      </div>
    </div>
  )
}
