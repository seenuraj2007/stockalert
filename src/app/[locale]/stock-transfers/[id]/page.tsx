'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { 
  ArrowLeft, ArrowUpDown, MapPin, Package, Edit, ArrowUpRight, 
  Trash2, CheckCircle, Clock, Truck, XCircle, AlertCircle,
  ThumbsUp, ThumbsDown, RefreshCw, User
} from 'lucide-react'
import Link from 'next/link'

interface TransferItem {
  id: string
  product_id: string
  product_name: string | null
  product_sku: string | null
  quantity: number
  received_qty: number | null
}

interface StockTransfer {
  id: string
  from_location_id: string
  to_location_id: string
  from_location_name: string | null
  to_location_name: string | null
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  priority: string
  notes: string | null
  requested_by: string
  approved_by: string | null
  approved_at: string | null
  approval_notes: string | null
  completed_by: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  items: TransferItem[]
}

export default function StockTransferDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [transfer, setTransfer] = useState<StockTransfer | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [approvalNotes, setApprovalNotes] = useState('')

  useEffect(() => {
    fetchTransferDetails()
  }, [resolvedParams?.id])

  const fetchTransferDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching transfer:', resolvedParams?.id)
      const res = await fetch(`/api/stock-transfers/${resolvedParams?.id}`)
      console.log('Response status:', res.status)
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to fetch transfer')
      }
      const data = await res.json()
      console.log('Transfer data:', data)
      setTransfer(data.stock_transfer)
    } catch (err: any) {
      console.error('Error fetching transfer details:', err)
      setError(err.message || 'Failed to load transfer')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this stock transfer?')) return

    try {
      const res = await fetch(`/api/stock-transfers/${resolvedParams?.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/stock-transfers')
      }
    } catch (error) {
      console.error('Error deleting transfer:', error)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/stock-transfers/${resolvedParams?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (res.ok) {
        await fetchTransferDetails()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApproval = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/stock-transfers/${resolvedParams?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: approvalAction,
          approval_notes: approvalNotes
        })
      })
      
      if (res.ok) {
        setShowApprovalModal(false)
        setApprovalNotes('')
        await fetchTransferDetails()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to process approval')
      }
    } catch (error) {
      console.error('Error processing approval:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string, priority?: string) => {
    const statusStyles = {
      pending: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200',
      in_transit: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200',
      completed: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200',
      cancelled: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200'
    }
    const statusLabels = {
      pending: 'Pending',
      in_transit: 'In Transit',
      completed: 'Completed',
      cancelled: 'Cancelled'
    }
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      in_transit: <Truck className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    }
    const priorityColors: Record<string, string> = {
      URGENT: 'ring-2 ring-red-500',
      HIGH: 'ring-2 ring-orange-400',
      NORMAL: '',
      LOW: 'opacity-75'
    }
    
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusStyles[status as keyof typeof statusStyles]} ${priorityColors[priority || 'NORMAL']}`}>
        {icons[status as keyof typeof icons]}
        {statusLabels[status as keyof typeof statusLabels]}
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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[priority] || colors.NORMAL}`}>
        {priority} Priority
      </span>
    )
  }

  // Progress steps
  const getProgressSteps = () => {
    if (!transfer) return []
    
    const steps = [
      { 
        status: 'created', 
        label: 'Created', 
        icon: Package,
        completed: true,
        date: transfer.created_at
      },
      { 
        status: 'pending', 
        label: 'Pending Approval', 
        icon: Clock,
        completed: transfer.status !== 'pending' || !!transfer.approved_by,
        date: transfer.approved_at
      },
      { 
        status: 'approved', 
        label: 'Approved', 
        icon: ThumbsUp,
        completed: ['in_transit', 'completed'].includes(transfer.status),
        date: transfer.approved_by ? transfer.approved_at : null
      },
      { 
        status: 'in_transit', 
        label: 'In Transit', 
        icon: Truck,
        completed: transfer.status === 'completed' || transfer.status === 'cancelled',
        date: null
      },
      { 
        status: 'completed', 
        label: 'Completed', 
        icon: CheckCircle,
        completed: transfer.status === 'completed',
        date: transfer.completed_at
      }
    ]
    
    return steps
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ArrowUpDown className="w-8 h-8 text-indigo-300" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading transfer details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchTransferDetails}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/stock-transfers"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Transfers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!transfer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center">
          <ArrowUpDown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Stock transfer not found</p>
        </div>
      </div>
    )
  }

  const progressSteps = getProgressSteps()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/stock-transfers" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
                <ArrowUpDown className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Stockox</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back & Title */}
        <div className="mb-8">
          <Link
            href="/stock-transfers"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all text-sm font-medium mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stock Transfers
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                    <ArrowUpDown className="w-6 h-6 text-purple-600" />
                  </div>
                  Transfer #{transfer.id.slice(0, 8)}
                </h1>
                {getPriorityBadge(transfer.priority)}
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(transfer.status, transfer.priority)}
                <span className="text-gray-500 flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  Created: {new Date(transfer.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {transfer.status === 'pending' && (
                <>
                  <button
                    onClick={() => { setApprovalAction('approve'); setShowApprovalModal(true) }}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-200 disabled:opacity-50 cursor-pointer"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => { setApprovalAction('reject'); setShowApprovalModal(true) }}
                    disabled={actionLoading}
                    className="px-4 py-2.5 border border-red-200 text-red-700 rounded-xl font-medium hover:bg-red-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              
              {transfer.status === 'in_transit' && (
                <button
                  onClick={() => handleStatusUpdate('COMPLETED')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-ind-white rounded-xl fontigo-600 text-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
              
              {transfer.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('CANCELLED')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              )}
              
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 border border-red-200 text-red-700 rounded-xl font-medium hover:bg-red-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Transfer Progress</h2>
          
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {progressSteps.map((step, index) => {
              const Icon = step.icon
              const isLast = index === progressSteps.length - 1
              
              return (
                <div key={step.status} className="flex items-center flex-1 min-w-[120px]">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all
                      ${step.completed 
                        ? 'bg-green-500 text-white' 
                        : transfer.status === 'cancelled' 
                          ? 'bg-red-100 text-red-500'
                          : 'bg-gray-100 text-gray-400'
                      }
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className={`mt-2 text-sm font-medium ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(step.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {!isLast && (
                    <div className={`
                      h-1 flex-1 mx-2 rounded transition-all
                      ${step.completed && progressSteps[index + 1]?.completed
                        ? 'bg-green-500'
                        : step.completed
                          ? 'bg-green-300'
                          : 'bg-gray-200'
                      }
                    `} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Transfer Details */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <ArrowUpDown className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Transfer Details</h2>
                  <p className="text-sm text-gray-500">Route and inventory information</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Route Visual */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-5 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <ArrowUpDown className="w-6 h-6 text-red-600 rotate-180" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">From</p>
                        <p className="font-semibold text-gray-900 text-lg">{transfer.from_location_name || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-indigo-600">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="flex-1 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <ArrowUpDown className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">To</p>
                        <p className="font-semibold text-gray-900 text-lg">{transfer.to_location_name || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                {transfer.notes && (
                  <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">Notes</p>
                    <p className="text-gray-900 leading-relaxed">{transfer.notes}</p>
                  </div>
                )}
                
                {/* Approval Info */}
                {transfer.approved_by && (
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <ThumbsUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          {transfer.status === 'cancelled' ? 'Rejected' : 'Approved'} by
                        </p>
                        <p className="font-semibold text-gray-900">
                          {transfer.approval_notes || (transfer.status === 'cancelled' ? 'Rejected' : 'Approved')}
                        </p>
                        {transfer.approved_at && (
                          <p className="text-xs text-gray-500">
                            {new Date(transfer.approved_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Summary</h2>
                  <p className="text-sm text-gray-500">Overview</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-gray-600 font-medium">Total Items</span>
                  </div>
                  <span className="font-bold text-gray-900 text-lg">{transfer.items.length}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-gray-600 font-medium">Total Units</span>
                  </div>
                  <span className="font-bold text-gray-900 text-lg">
                    {transfer.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <p className="text-sm text-indigo-600 mb-1">Current Status</p>
                  <p className="text-xl font-bold text-indigo-900 capitalize">
                    {transfer.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Transfer Items</h2>
              <p className="text-sm text-gray-500">Products being transferred</p>
            </div>
          </div>
          
          {transfer.items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No items in this transfer</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transfer.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Package className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-900">{item.product_name || 'Unknown Product'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {item.product_sku || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {transfer.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Received
                          </span>
                        ) : transfer.status === 'in_transit' ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium">
                            <Truck className="w-4 h-4" />
                            In Transit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {approvalAction === 'approve' ? 'Approve Transfer' : 'Reject Transfer'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder={approvalAction === 'approve' ? 'Add approval notes...' : 'Reason for rejection...'}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproval}
                disabled={actionLoading}
                className={`flex-1 px-4 py-3 rounded-xl font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                  approvalAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : approvalAction === 'approve' ? (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    Confirm Approval
                  </>
                ) : (
                  <>
                    <ThumbsDown className="w-4 h-4" />
                    Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
