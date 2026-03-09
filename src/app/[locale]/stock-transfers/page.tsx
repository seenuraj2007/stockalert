'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, ArrowUpDown, Edit, Trash2, ArrowUpRight, Package, 
  ChevronRight, Search, Filter, Download, Upload, RefreshCw,
  Clock, CheckCircle, XCircle, Truck, AlertTriangle, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import SidebarLayout from '@/components/SidebarLayout'

interface StockTransfer {
  id: string
  from_location_id: string
  to_location_id: string
  from_location_name: string | null
  to_location_name: string | null
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  priority: string
  notes: string | null
  created_at: string
  items_count: number
  total_quantity: number
}

export default function StockTransfersPage() {
  const router = useRouter()
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchTransfers()
  }, [statusFilter, sortBy, sortOrder])

  const fetchTransfers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('sortBy', sortBy === 'created_at' ? 'createdAt' : sortBy)
      params.set('sortOrder', sortOrder)
      
      const res = await fetch(`/api/stock-transfers?${params}`)
      if (res.status === 401) {
        router.push('/auth')
        return
      }
      const data = await res.json()
      setTransfers(data.transfers || [])
    } catch (error) {
      console.error('Error fetching stock transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock transfer?')) return

    const previousTransfers = [...transfers]
    setTransfers(transfers.filter(t => t.id !== id))

    try {
      const res = await fetch(`/api/stock-transfers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setTransfers(previousTransfers)
      }
    } catch (error) {
      console.error('Error deleting stock transfer:', error)
      setTransfers(previousTransfers)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/stock-transfers/bulk?status=${statusFilter}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `stock-transfers-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting transfers:', error)
    }
  }

  // Filter transfers based on search
  const filteredTransfers = useMemo(() => {
    if (!searchTerm) return transfers
    const term = searchTerm.toLowerCase()
    return transfers.filter(t => 
      t.from_location_name?.toLowerCase().includes(term) ||
      t.to_location_name?.toLowerCase().includes(term) ||
      t.id.toLowerCase().includes(term) ||
      t.notes?.toLowerCase().includes(term)
    )
  }, [transfers, searchTerm])

  const getStatusBadge = (status: string, priority?: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200',
      in_transit: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200',
      completed: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200',
      cancelled: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200'
    }
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      in_transit: 'In Transit',
      completed: 'Completed',
      cancelled: 'Cancelled'
    }
    const statusIcons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-3 h-3" />,
      in_transit: <Truck className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      cancelled: <XCircle className="w-3 h-3" />
    }
    const priorityColors: Record<string, string> = {
      URGENT: 'ring-2 ring-red-500',
      HIGH: 'ring-2 ring-orange-400',
      NORMAL: '',
      LOW: 'opacity-75'
    }
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || statusStyles.pending} ${priorityColors[priority || 'NORMAL']}`}>
        {statusIcons[status]}
        {statusLabels[status] || status}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      URGENT: 'bg-red-500 text-white',
      HIGH: 'bg-orange-500 text-white',
      NORMAL: 'bg-gray-500 text-white',
      LOW: 'bg-gray-300 text-gray-700'
    }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.NORMAL}`}>
        {priority}
      </span>
    )
  }

  // Stats
  const stats = useMemo(() => ({
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    inTransit: transfers.filter(t => t.status === 'in_transit').length,
    completed: transfers.filter(t => t.status === 'completed').length
  }), [transfers])

  return (
    <SidebarLayout>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 sm:pb-0">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {stats.total} transfers • {stats.pending} pending • {stats.inTransit} in transit
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleExport}
                className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Export CSV"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={fetchTransfers}
                className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link
                href="/stock-transfers/new"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Transfer</span>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transfers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              {['all', 'pending', 'in_transit', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-gray-600 font-medium">Loading transfers...</p>
            </div>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ArrowUpDown className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No stock transfers found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'No transfers match your search criteria. Try adjusting your filters.'
                : 'Get started by creating your first stock transfer to move inventory between locations.'}
            </p>
            <Link
              href="/stock-transfers/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              New Transfer
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => router.push(`/stock-transfers/${transfer.id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Transfer Info */}
                  <div className="flex items-start gap-4">
                    {/* Route Visual */}
                    <div className="hidden sm:flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-100 to-orange-100 shadow-sm">
                        <ArrowUpDown className="w-6 h-6 text-red-600 rotate-180" />
                      </div>
                      <div className="w-0.5 h-8 bg-gradient-to-b from-red-300 to-green-300"></div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100 shadow-sm">
                        <ArrowUpDown className="w-6 h-6 text-green-600" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-mono">#{transfer.id.slice(0, 8)}</span>
                        {getPriorityBadge(transfer.priority)}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{transfer.from_location_name || 'Unknown'}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">{transfer.to_location_name || 'Unknown'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {transfer.items_count} items ({transfer.total_quantity} units)
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(transfer.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {getStatusBadge(transfer.status, transfer.priority)}
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/stock-transfers/${transfer.id}/edit`)
                        }}
                        className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(transfer.id)
                        }}
                        className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/stock-transfers/${transfer.id}`)
                        }}
                        className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        title="View Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress indicator for pending/in-transit */}
                {(transfer.status === 'pending' || transfer.status === 'in_transit') && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            transfer.status === 'pending' 
                              ? 'bg-amber-400 w-1/3' 
                              : 'bg-blue-500 w-2/3'
                          }`}
                        />
                      </div>
                      <span className="text-gray-500 text-xs">
                        {transfer.status === 'pending' ? 'Awaiting approval' : 'In transit'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination info */}
        {filteredTransfers.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {filteredTransfers.length} of {stats.total} transfers
          </div>
        )}
      </div>
    </div>
    </SidebarLayout>
  )
}
