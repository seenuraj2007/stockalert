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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
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

      {/* Expiring Batches List */}
      <div className="divide-y divide-gray-100">
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
