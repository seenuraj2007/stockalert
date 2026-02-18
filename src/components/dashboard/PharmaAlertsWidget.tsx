'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, Package, TrendingUp, Thermometer, Pill, Calendar } from 'lucide-react'

interface ExpiringBatch {
  id: string
  batchNumber: string
  expiryDate: string
  daysUntilExpiry: number
  quantity: number
  product: {
    id: string
    name: string
    sku: string
    drugSchedule: string
    requiresPrescription: boolean
  }
  location: string
  priority: 'high' | 'medium' | 'low'
}

export default function PharmaAlertsWidget() {
  const [batches, setBatches] = useState<ExpiringBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    highPriority: 0,
    mediumPriority: 0,
    totalValue: 0
  })

  useEffect(() => {
    fetchExpiringBatches()
  }, [])

  const fetchExpiringBatches = async () => {
    try {
      const res = await fetch('/api/pharma/fefo-pick?days=90')
      if (res.ok) {
        const data = await res.json()
        setBatches(data.batches.slice(0, 5)) // Show top 5
        setStats({
          highPriority: data.highPriority,
          mediumPriority: data.mediumPriority,
          totalValue: data.batches.reduce((sum: number, b: ExpiringBatch) => sum + (b.quantity * 100), 0) // Estimated
        })
      }
    } catch (error) {
      console.error('Error fetching expiring batches:', error)
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

  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Pill className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Pharmaceutical Alerts</h3>
            <p className="text-sm text-gray-500">No urgent alerts</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-green-700 font-medium">All medicines are within safe expiry dates</p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Expiring Medicines</h3>
              <p className="text-xs text-gray-500">FEFO alerts</p>
            </div>
          </div>
          <Link 
            href="/batches"
            className="p-2 bg-gray-100 rounded-full"
          >
            <TrendingUp className="w-5 h-5 text-gray-600" />
          </Link>
        </div>

        {/* Mobile Stats Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {stats.highPriority > 0 && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-red-500 rounded-full shadow-sm">
              <AlertTriangle className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">{stats.highPriority} Critical</span>
            </div>
          )}
          {stats.mediumPriority > 0 && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-orange-500 rounded-full shadow-sm">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">{stats.mediumPriority} Warning</span>
            </div>
          )}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-green-500 rounded-full shadow-sm">
            <Package className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">{batches.length} Batches</span>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:block p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Expiring Medicines</h3>
              <p className="text-sm text-gray-500">FEFO alerts</p>
            </div>
          </div>
          <Link 
            href="/batches"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View All
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4">
          {stats.highPriority > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">{stats.highPriority} Critical</span>
            </div>
          )}
          {stats.mediumPriority > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-700">{stats.mediumPriority} Warning</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="sm:hidden space-y-3 p-4">
        {batches.map((batch, index) => (
          <div 
            key={batch.id} 
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-all ${
              batch.priority === 'high' ? 'border-l-4 border-l-red-500' : ''
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">{batch.product.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{batch.product.sku}</p>
              </div>
              <div className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full ${
                batch.priority === 'high' 
                  ? 'bg-red-100 text-red-700' 
                  : batch.priority === 'medium'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{batch.daysUntilExpiry}d</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              {batch.product.requiresPrescription && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                  Rx
                </span>
              )}
              {batch.product.drugSchedule && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg">
                  {batch.product.drugSchedule}
                </span>
              )}
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                {batch.batchNumber}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{batch.quantity}</span>
                  <span className="text-gray-400">units</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">{batch.location}</span>
              </div>
              <span className="text-xs text-gray-400">
                Exp {new Date(batch.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop List */}
      <div className="hidden sm:block divide-y divide-gray-100">
        {batches.map((batch) => (
          <div 
            key={batch.id} 
            className={`p-4 hover:bg-gray-50 transition-colors ${
              batch.priority === 'high' ? 'bg-red-50/50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate">{batch.product.name}</p>
                  {batch.product.requiresPrescription && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      Rx
                    </span>
                  )}
                  {batch.product.drugSchedule && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                      {batch.product.drugSchedule}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Batch: {batch.batchNumber} • {batch.location}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Package className="w-4 h-4" />
                    {batch.quantity} units
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  batch.priority === 'high' 
                    ? 'bg-red-100 text-red-700' 
                    : batch.priority === 'medium'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">
                    {batch.daysUntilExpiry} days
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Expires {new Date(batch.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total at risk: <span className="font-semibold text-gray-900">{batches.length} batches</span>
          </span>
          <Link 
            href="/pharma/expiry-report"
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <TrendingUp className="w-4 h-4" />
            View Report
          </Link>
        </div>
      </div>
    </div>
  )
}
